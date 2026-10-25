# Multi-stage Dockerfile for HomeNet NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install curl and Ookla speedtest or dependencies if needed
RUN apk add --no-cache curl ca-certificates dumb-init

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/drizzle ./drizzle

# Create non-root user
USER node

EXPOSE 3001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/src/main"]
