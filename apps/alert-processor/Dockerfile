FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nest-cli.json tsconfig.json ./
COPY apps/alert-processor/package.json apps/alert-processor/tsconfig.app.json ./apps/alert-processor/
COPY apps/alert-processor ./apps/alert-processor
RUN pnpm install --frozen-lockfile
RUN pnpm --filter alert-processor exec prisma generate
RUN pnpm run build:alert-processor

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/alert-processor/package.json ./apps/alert-processor/package.json
COPY apps/alert-processor/prisma ./apps/alert-processor/prisma
RUN pnpm install --prod --frozen-lockfile || true
COPY --from=builder /app/node_modules ./node_modules
RUN pnpm --filter alert-processor exec prisma generate || true
COPY --from=builder /app/dist/apps/alert-processor ./dist/apps/alert-processor
USER node
CMD ["node", "dist/apps/alert-processor/main.js"]
