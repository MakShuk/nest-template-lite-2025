# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV BACKEND_PORT=5686

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy runtime artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/envs ./envs

EXPOSE ${BACKEND_PORT}

CMD ["npm", "run", "start:prod"]
