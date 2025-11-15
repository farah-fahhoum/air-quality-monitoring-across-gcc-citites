# Air Quality Monitoring (GCC Cities)

Real-time air quality monitoring with two NestJS services:
- `data-collector` polls OpenWeather for Riyadh, Dubai, Doha, Muscat and publishes alerts to RabbitMQ
- `alert-processor` consumes alerts and persists them to PostgreSQL, exposing REST endpoints

## Prerequisites
- Docker Desktop (includes Docker Compose)
- Node.js 20+
- PNPM (Corepack enabled: `corepack enable`)

## Setup
- Install dependencies:
  - `pnpm install`
- Create `.env` in project root with values:
  - `OPENWEATHER_API_KEY=<your_api_key>`
  - `RABBITMQ_URL=amqp://rabbitmq:5672`
  - `DATABASE_URL=postgresql://admin:<password>@postgres:5432/aq_alerts`
  - `DATA_COLLECTOR_PORT=3000`
  - `ALERT_PROCESSOR_PORT=3001`

## Run (Docker Compose)
- Start all services:
  - `pnpm run docker:up`
- Apply DB migrations (first run):
  - `pnpm --filter alert-processor exec bash -lc "DATABASE_URL=postgresql://admin:<password>@localhost:5432/aq_alerts prisma migrate deploy"`
- Verify services:
  - Data Collector health: `curl http://localhost:3000/air-quality/health`
  - Alert Processor health: `curl http://localhost:3001/alerts/health`
  - List alerts: `curl "http://localhost:3001/alerts?limit=20"`

## Run (Local Dev)
- Start Postgres locally:
  - `docker run -d --name aq-postgres -p 5432:5432 -e POSTGRES_DB=aq_alerts -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=<password> postgres:13`
- Start RabbitMQ locally:
  - `docker run -d --name aq-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management`
- Start alert-processor dev server:
  - `pnpm run start:dev:alert-processor`
- Start data-collector dev server:
  - `pnpm run start:dev:data-collector`

## Endpoints
- Data Collector
  - `GET /air-quality/health` → `http://localhost:3000/air-quality/health`
- Alert Processor
  - `GET /alerts` (query `limit`, max 20) → `http://localhost:3001/alerts?limit=20`
  - `GET /alerts/health` → `http://localhost:3001/alerts/health`

## Troubleshooting
- Prisma “database not reachable”:
  - Ensure Postgres is up; in Compose the host is `postgres`, locally it is `localhost`
- RabbitMQ connection errors:
  - Use `RABBITMQ_URL=amqp://rabbitmq:5672` in Compose or `amqp://localhost:5672` locally
- 404 on `/alerts` in container:
  - Rebuild the image to pick up latest routes: `docker-compose build alert-processor && docker-compose up -d alert-processor`
