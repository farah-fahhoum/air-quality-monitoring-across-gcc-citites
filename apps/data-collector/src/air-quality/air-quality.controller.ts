import { Controller, Get } from "@nestjs/common";

@Controller("air-quality")
export class AirQualityController {
  @Get("health")
  healthCheck() {
    return {
      status: "OK",
      service: "data-collector",
      timestamp: new Date().toISOString(),
    };
  }
}
