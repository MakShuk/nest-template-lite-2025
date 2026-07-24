# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy only build inputs so local files and environment files never enter an image layer.
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3424

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3424

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT ?? 3424}/health`).then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/main.js"]
