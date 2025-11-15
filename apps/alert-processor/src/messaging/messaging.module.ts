import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AlertsModule } from "../alerts/alerts.module";
import { RabbitMQConsumerService } from "./rabbitmq.consumer.service";

@Module({
  imports: [ConfigModule, AlertsModule],
  providers: [RabbitMQConsumerService],
  exports: [RabbitMQConsumerService],
})
export class MessagingModule {}
