# AI Proxy - NestJS Starter Template

Стартовый шаблон для NestJS приложений с TypeScript, настроенный с использованием лучших практик разработки.

## 🚀 Основные технологии

- **NestJS** v11.1.6 - Progressive Node.js framework
- **TypeScript** v5.9.3 - Строгая типизация
- **Swagger/OpenAPI** - Автоматическая документация API
- **Joi** - Валидация конфигурации
- **Class Validator & Transformer** - Валидация и трансформация DTO
- **Docker** - Контейнеризация приложения

## 📋 Требования

- Node.js >= 2.0.0
- npm >= 9.0.0

## 🛠️ Установка

```bash
# Установка зависимостей
npm install
```

## 🏃 Запуск приложения

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm start:debug
```

## 🐳 Docker

```bash
# Запуск с помощью Docker Compose
docker-compose up -d
```

## 📁 Структура проекта

```
ai-proxy/
├── src/
│   ├── configs/          # Конфигурация приложения
│   ├── setup/            # Настройки (CORS, Swagger, Logging)
│   ├── app.module.ts     # Корневой модуль
│   └── main.ts           # Точка входа
├── envs/                 # Файлы окружения
├── .kilocode/            # Правила для AI ассистента
└── docker-compose.yml    # Docker конфигурация
```

## ⚙️ Конфигурация

Переменные окружения настраиваются через файлы в директории `envs/`:
- `.env.development` - для разработки
- `.env.production` - для продакшена
- `.env.example` - пример конфигурации

Основные переменные:
- `BACKEND_PORT` - порт приложения (по умолчанию: 5686)

## 🔧 Особенности

- ✅ Глобальная валидация с автоматической трансформацией типов
- ✅ Swagger документация из коробки
- ✅ Строгая конфигурация TypeScript
- ✅ Поддержка алиасов путей (@/*)
- ✅ Docker готовность
- ✅ Настроенный .gitignore

## 📝 Лицензия

UNLICENSED

## 👤 Автор

Maksim Shuklin