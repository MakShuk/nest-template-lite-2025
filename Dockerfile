# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

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

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Открываем порт
EXPOSE ${BACKEND_PORT}

# Запуск приложения
CMD ["npm", "run", "start:prod"]
