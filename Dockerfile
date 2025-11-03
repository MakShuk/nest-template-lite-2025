# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Этап production
FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем переменные окружения для runtime
ENV NODE_ENV=production
ENV BACKEND_PORT=5686

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Копируем сгенерированный Prisma клиент
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Генерируем Prisma Client для production
RUN npx prisma generate

# Открываем порт
EXPOSE ${BACKEND_PORT}

# Запуск с миграцией
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
