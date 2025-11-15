import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";
import { AlertsService } from "../alerts/alerts.service";

interface AirQualityAlert {
  dateTime: string;
  city: string;
  regionCode: string;
  indexes: Array<{
    code: string;
    displayName: string;
    aqi: number;
    aqiDisplay: string;
    color: any;
    category: string;
    dominantPollutant: string;
  }>;
}

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private connection?: any;
  private channel?: any;
  private readonly queueName = "air-quality-alerts";
  private readonly exchangeName = "air-quality";
  private readonly exchangeType = "topic";

  constructor(
    private configService: ConfigService,
    private alertsService: AlertsService
  ) {}

  async onModuleInit() {
    await this.connectAndConsume();
  }

  async onModuleDestroy() {
    try {
      if (this.channel?.close) {
        await this.channel.close();
      }
      if (this.connection?.close) {
        await this.connection.close();
      }
    } catch {}
  }

  private async connectAndConsume() {
    try {
      const primary =
        this.configService.get<string>("RABBITMQ_URL") ||
        "amqp://localhost:5672";
      const fallback = "amqp://localhost:5672";

      try {
        this.connection = await amqp.connect(primary);
      } catch (err: any) {
        if (
          primary !== fallback &&
          (err?.code === "ENOTFOUND" || err?.code === "ECONNREFUSED")
        ) {
          this.connection = await amqp.connect(fallback);
        } else {
          throw err;
        }
      }

      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
      });
      await this.channel.assertQueue(this.queueName, { durable: true });
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        "alerts.critical"
      );

      this.channel.consume(this.queueName, async (message) => {
        if (message !== null) {
          try {
            const alertData: AirQualityAlert = JSON.parse(
              message.content.toString()
            );
            await this.processAlert(alertData);

            // Acknowledge message processing
            this.channel.ack(message);
          } catch (error) {
            console.error("Error processing message");
          }
        }
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ");
      setTimeout(() => this.connectAndConsume(), 5000);
    }
  }

  private async processAlert(alertData: AirQualityAlert) {
    try {
      const uaqiIndex = alertData.indexes.find(
        (index) => index.code === "uaqi"
      );

      if (!uaqiIndex) {
        console.warn("No UAQI index found in alert data");
        return;
      }

      // Create alert in database
      await this.alertsService.create({
        city: alertData.city,
        aqi: uaqiIndex.aqi,
        category: uaqiIndex.category,
        dominantPollutant: uaqiIndex.dominantPollutant,
        timestamp: alertData.dateTime,
      });

      // Log alert
      this.logAlert(alertData, uaqiIndex);
    } catch (error) {
      console.error("Error processing alert", error);
    }
  }

  private logAlert(alertData: AirQualityAlert, uaqiIndex: any) {
    console.log(
      `
[ALERT] CRITICAL AIR QUALITY DETECTED
City: ${alertData.city} | Region: ${alertData.regionCode}
AQI: ${uaqiIndex.aqi} | Category: ${uaqiIndex.category}
Dominant: ${uaqiIndex.dominantPollutant} | Color: ${uaqiIndex.color}
Timestamp: ${alertData.dateTime}
    `.trim() + "\n\n"
    );
  }
}
