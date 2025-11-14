import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AirQualityService } from "./air-quality.service";
import { AirQualityController } from "./air-quality.controller";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [
    HttpModule, // Calls to Air Quality API
    ConfigModule,
    ScheduleModule.forRoot(), // Cron jobs (polling every 10 seconds)
    MessagingModule,
  ],
  controllers: [AirQualityController],
  providers: [AirQualityService],
})
export class AirQualityModule {}
