# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3424

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/envs ./envs

# Run as the unprivileged user that the base image already provides
USER node

EXPOSE 3424

CMD ["npm", "run", "start:prod"]
