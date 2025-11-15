import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const defaultLocal =
      "postgresql://admin:wDok4xI6tXH2oEu1@localhost:5432/aq_alerts";
    const rawUrl = (process.env.DATABASE_URL || "").trim();
    let effectiveUrl = rawUrl || defaultLocal;
    try {
      const u = new URL(effectiveUrl);
      const inDocker = process.env.IN_DOCKER === "true";
      if (!inDocker && u.hostname === "postgres") {
        u.hostname = "localhost";
        effectiveUrl = u.toString();
      }
    } catch {}

    super({
      log: ["warn", "error"],
      datasources: { db: { url: effectiveUrl } },
    });
  }
  async onModuleInit() {
    const retries = 20;
    const delayMs = 2000;
    for (let i = 0; i < retries; i++) {
      try {
        await this.$connect();
        return;
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
