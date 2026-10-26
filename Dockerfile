# Multi-stage Dockerfile for HomeNet NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-bookworm-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl dumb-init gnupg iproute2 iputils-ping net-tools \
    && install -d -m 0755 /etc/apt/keyrings \
    && curl -fsSL https://packagecloud.io/ookla/speedtest-cli/gpgkey \
      | gpg --dearmor -o /etc/apt/keyrings/ookla-speedtest-cli.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/ookla-speedtest-cli.gpg] https://packagecloud.io/ookla/speedtest-cli/debian bookworm main" \
      > /etc/apt/sources.list.d/ookla-speedtest-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends speedtest \
    && speedtest --version \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/drizzle ./drizzle

# Create non-root user
USER node

EXPOSE 3001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/src/main"]
