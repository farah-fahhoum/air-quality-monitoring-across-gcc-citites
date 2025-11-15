import { Controller, Get, Query } from "@nestjs/common";
import { AlertsService } from "./alerts.service";

@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(@Query("limit") limit: string) {
    //Max of requested records can be 20
    const alertLimit = limit ? Math.min(parseInt(limit), 20) : 20;
    const alerts = await this.alertsService.findAll(alertLimit);

    return alerts.map((alert) => ({
      city: alert.city,
      aqi: alert.aqi,
      category: alert.category,
      timestamp: alert.timestamp.toISOString(),
    }));
  }
  @Get("health")
  healthCheck() {
    return {
      status: "OK",
      service: "data-collector",
      timestamp: new Date().toISOString(),
    };
  }
}
