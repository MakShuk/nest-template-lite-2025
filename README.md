# NestJS Starter Template (lite)

Стартовый шаблон для NestJS-приложений на TypeScript с готовыми лучшими практиками:
структурированный логгер с correlation id, глобальная валидация, конфигурация через Joi,
Swagger, CORS, поддержка CLI-команд и Docker.

## 🚀 Технологии

- **NestJS** 11 — Progressive Node.js framework
- **TypeScript** 5.9 — строгая типизация (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Biome** 2 — линтер и форматтер
- **Joi** — валидация переменных окружения
- **Swagger / OpenAPI** — автоматическая документация API
- **class-validator / class-transformer** — валидация и трансформация DTO
- **nest-commander** — CLI-команды
- **Docker** — контейнеризация приложения

## 📋 Требования

- Node.js >= 24
- npm >= 10

## 🛠️ Установка

```bash
npm install
cp envs/.env.example envs/.env.development
```

## 🏃 Запуск

```bash
# Разработка (watch)
npm run start:dev

# Production
npm run build
npm run start:prod

# Debug
npm run start:debug
```

## 🖥️ CLI

CLI собирается из того же `AppModule` через `nest-commander`.

```bash
# Из исходников
npm run cli:dev -- send-message

# Из сборки
npm run build
npm run cli -- send-message
```

`send-message` — пример команды (см. `src/send-message.command.ts`), на её основе
создаются собственные команды.

## 🧹 Линтинг и форматирование

```bash
npm run check       # линт + формат (проверка)
npm run check:fix   # автоисправление
npm run lint        # только линт
npm run format      # только формат
```

## 🐳 Docker

```bash
docker-compose up -d --build
```

Образ собирается многоступенчато (build → production), запускается под непривилегированным
пользователем `node`. Файл `envs/.env.production` опционален: при его отсутствии используются
значения из `environment` в `docker-compose.yml` и значения по умолчанию из кода.

## ⚙️ Конфигурация

Переменные окружения загружаются из `envs/.env.${NODE_ENV}` и валидируются схемой Joi
(`src/configs/config.schema.ts`). Значения по умолчанию — в `src/configs/constants.ts`.

| Переменная               | По умолчанию    | Описание                                                       |
| ------------------------ | --------------- | ------------------------------------------------------------- |
| `APP_NAME`               | `nest-cli-lite` | Имя приложения (используется в логах и заголовке Swagger)     |
| `PORT`                   | `3424`          | Порт HTTP-сервера                                             |
| `NODE_ENV`               | `development`   | `development` \| `production`                                 |
| `ENABLE_SWAGGER`         | `true`          | Включить Swagger (в `development` включён всегда)             |
| `ENABLE_REQUEST_LOGGING` | `true`          | Логировать HTTP-запросы/ответы                               |
| `ALLOWED_ORIGINS`        | _(пусто)_       | Список origin'ов CORS через запятую; пусто — разрешить все    |

Swagger доступен по адресу `http://localhost:${PORT}/api`.

## 📁 Структура проекта

```
src/
├── configs/          # Конфигурация (Joi-схема, AppConfigService, константы)
├── logger/           # Логгер с correlation id, интерцептор и exception-фильтр
├── setup/            # Настройка CORS и Swagger
├── send-message.command.ts  # Пример CLI-команды
├── app.module.ts     # Корневой модуль
├── main.ts           # HTTP entrypoint
└── cli.ts            # CLI entrypoint
envs/                 # Файлы окружения (.env.example в репозитории)
```

## 📝 Лицензия

UNLICENSED

## 👤 Автор

Maksim Shuklin
