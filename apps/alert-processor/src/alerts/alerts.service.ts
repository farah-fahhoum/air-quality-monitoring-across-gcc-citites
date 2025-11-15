import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateAlertDto } from "./create-alert.dto";

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(createAlertDto: CreateAlertDto) {
    return await this.prisma.alert.create({
      data: createAlertDto,
    });
  }

  async findAll(limit: number = 20) {
    return await this.prisma.alert.findMany({
      take: limit,
      orderBy: {
        timestamp: "desc",
      },
      select: {
        city: true,
        aqi: true,
        category: true,
        timestamp: true,
      },
    });
  }
}
