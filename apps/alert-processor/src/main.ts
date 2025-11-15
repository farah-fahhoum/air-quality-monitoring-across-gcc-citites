import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AlertsModule } from "./alerts/alerts.module";
import { MessagingModule } from "./messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../.env",
    }),
    DatabaseModule,
    AlertsModule,
    MessagingModule,
  ],
})
class RootModule {}
async function bootstrap() {
  const app = await NestFactory.create(RootModule);
  const configService = app.get(ConfigService);

  const port = configService.get("ALERT_PROCESSOR_PORT") || 3001;

  await app.listen(port);
  console.log(`Alert Processor service running on port ${port}`);
  console.log(`Monitoring RabbitMQ for air quality alerts...`);
}
bootstrap();
