import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

export interface AirQualityAlert {
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
  pollutants?: {
    pm25?: { concentration: number };
    pm10?: { concentration: number };
  };
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection?: any;
  private channel?: any;
  private readonly queueName = "air-quality-alerts";

  constructor(private configService: ConfigService) {}

  //Initialize RabbitMQ connection on module init
  async onModuleInit() {
    await this.connect();
  }

  //Close RabbitMQ connection on module destroy
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

  private async connect() {
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
      await this.channel.assertQueue(this.queueName, { durable: true });
    } catch (error) {
      console.error("Error connecting to RabbitMQ");
    }
  }

  async publishAlert(alert: AirQualityAlert): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const message = JSON.stringify(alert);
      const success = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(message),
        { persistent: true }
      );

      if (!success) {
        console.warn(`Failed to publish alert for ${alert.city}`);
      }
      return success;
    } catch (error) {
      console.error("Error publishing alert", error);
      return false;
    }
  }
}
