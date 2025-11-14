import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  RabbitMQService,
  AirQualityAlert,
} from "../messaging/rabbitmq.service";
import { CITIES, CRITICAL_THRESHOLDS } from "../constant-data";
import { firstValueFrom } from "rxjs";

interface OpenWeatherItem {
  main: { aqi: number };
  components: {
    pm2_5?: number;
    pm10?: number;
    co?: number;
    no?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    nh3?: number;
  };
  dt: number;
}

interface OpenWeatherAirQualityResponse {
  coord: { lon: number; lat: number };
  list: OpenWeatherItem[];
}

@Injectable()
export class AirQualityService {
  private readonly logger = new Logger(AirQualityService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rabbitMQService: RabbitMQService
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollAllCities() {
    try {
      const pollingPromises = CITIES.map((city) => this.pollCity(city));
      await Promise.all(pollingPromises);
    } catch (error) {
      this.logger.error("Internal Error in polling cities data", error);
    }
  }

  //Call OpenWeatherMap Air Pollution API for each city and publish alert if critical
  private async pollCity(city: (typeof CITIES)[0]) {
    try {
      const apiKey = this.configService.get("OPENWEATHER_API_KEY");
      if (!apiKey) {
        throw new Error("Missing OpenWeather API key");
      }

      const url = "https://api.openweathermap.org/data/2.5/air_pollution";
      const response = await firstValueFrom(
        this.httpService.get<OpenWeatherAirQualityResponse>(url, {
          params: {
            lat: city.latitude,
            lon: city.longitude,
            appid: apiKey,
          },
          timeout: 5000,
        })
      );
      const airQualityData = response.data;

      // Check if air quality is critical
      if (this.isCriticalAirQuality(airQualityData)) {
        await this.publishCriticalAlert(city, airQualityData);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const details = data ? JSON.stringify(data) : error?.message;
      this.logger.error(
        `Failed to poll ${city.name}${status ? ` [${status}]` : ""}: ${details}`
      );
    }
  }

  private isCriticalAirQuality(data: OpenWeatherAirQualityResponse): boolean {
    const item = data.list && data.list[0];
    if (!item) return false;
    const pm25 = item.components.pm2_5 ?? 0;
    const pm10 = item.components.pm10 ?? 0;
    if (pm25 > CRITICAL_THRESHOLDS.PM2_5) return true;
    if (pm10 > CRITICAL_THRESHOLDS.PM10) return true;
    return false;
  }

  //If air quality is critical for the provided city, publish alert to RabbitMQ
  private async publishCriticalAlert(
    city: (typeof CITIES)[0],
    data: OpenWeatherAirQualityResponse
  ) {
    const item = data.list[0];
    const pm25 = item.components.pm2_5 ?? 0;
    const pm10 = item.components.pm10 ?? 0;
    const dominantPollutant = pm25 >= pm10 ? "pm2_5" : "pm10";
    const category = (() => {
      switch (item.main.aqi) {
        case 1:
          return "Good";
        case 2:
          return "Fair";
        case 3:
          return "Moderate";
        case 4:
          return "Poor";
        case 5:
          return "Very Poor";
        default:
          return "Unknown";
      }
    })();
    const alert: AirQualityAlert = {
      dateTime: new Date(item.dt * 1000).toISOString(),
      city: city.name,
      regionCode: city.countryCode,
      indexes: [
        {
          code: "uaqi",
          displayName: "OpenWeather AQI",
          aqi: item.main.aqi,
          aqiDisplay: String(item.main.aqi),
          color: null,
          category,
          dominantPollutant,
        },
      ],
      pollutants: {
        pm25: { concentration: pm25 },
        pm10: { concentration: pm10 },
      },
    };
    await this.rabbitMQService.publishAlert(alert);
  }
}
