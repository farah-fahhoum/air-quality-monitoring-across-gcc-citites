import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AirQualityModule } from "./air-quality/air-quality.module";
import { MessagingModule } from "./messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    AirQualityModule,
    MessagingModule,
  ],
})
class RootModule {}

async function bootstrap() {
  const app = await NestFactory.create(RootModule);
  const configService = app.get(ConfigService);

  const port = configService.get("DATA_COLLECTOR_PORT") || 3000;

  await app.listen(port);
  console.log(`Data Collector service running on port ${port}`);
  console.log(`Polling GCC cities every 10 seconds.`);
}
bootstrap();
