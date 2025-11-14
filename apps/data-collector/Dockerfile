FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nest-cli.json tsconfig.json ./
COPY apps/data-collector/package.json apps/data-collector/tsconfig.app.json ./apps/data-collector/
COPY apps/data-collector ./apps/data-collector
RUN pnpm install --frozen-lockfile --filter data-collector...
RUN pnpm run build:data-collector

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/data-collector/package.json ./apps/data-collector/package.json
RUN pnpm install --prod --frozen-lockfile --filter data-collector...
COPY --from=builder /app/dist/apps/data-collector ./dist/apps/data-collector
USER node
CMD ["node", "dist/apps/data-collector/main.js"]