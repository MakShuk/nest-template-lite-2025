# NestJS Starter Template (lite)

Универсальный шаблон NestJS-приложения без предметной и бизнес-логики. Он предоставляет
безопасную HTTP-базу, типизированную конфигурацию, логирование, OpenAPI, CLI, тестовый контур
и Docker-сборку, которые можно использовать как основу отдельного проекта.

## Что обновлено

- зависимости обновлены до актуальных совместимых релизов NestJS 11, Biome 2.5 и SWC;
- TypeScript обновлён до 6.x, а устаревшие `moduleResolution: node` и `baseUrl` заменены на
  `NodeNext`, `rootDir` и явные Node.js types;
- удалён непинованный post-build-вызов `npx tsc-alias`: сборка больше не загружает исполняемый
  пакет из сети;
- глобальные pipe, interceptor и exception filter регистрируются через Nest DI;
- конфигурация строго типизирована через `ConfigService<EnvironmentVariables, true>`;
- добавлены Helmet, безопасные настройки CORS и проверка входных correlation/request IDs;
- HTTP-ошибки имеют единый формат и сохраняют публичные сообщения `ValidationPipe`;
- добавлены `/health`, встроенные Node.js tests и единая команда `npm run verify`;
- Docker build получает только необходимые файлы, не копирует env-файлы и запускает Node.js
  непривилегированным пользователем;
- Compose-контейнер работает с `read_only`, `no-new-privileges`, init-процессом и healthcheck.

TypeScript 7 пока не используется намеренно: первая стабильная версия нового нативного
компилятора не предоставляет программный API, от которого всё ещё зависят некоторые
инструменты экосистемы. Конфигурация уже очищена от удалённых в TypeScript 7 параметров, что
упрощает будущий переход после подтверждения совместимости NestJS-инструментов.

## Технологии

- Node.js 24 LTS и npm 11
- NestJS 11 и Express 5
- TypeScript 6, SWC и строгая проверка типов
- Biome 2.5
- `@nestjs/config` и Joi
- Swagger / OpenAPI
- `class-validator` и `class-transformer`
- `nest-commander`
- Helmet
- Docker и Docker Compose
- встроенный `node:test` + Supertest

## Требования

- Node.js >= 24
- npm >= 11
- Docker с Compose v2 — только для контейнерного запуска

Проверьте локальные версии:

```bash
node --version
npm --version
```

## Установка

```bash
npm ci
```

Создайте локальную конфигурацию разработки.

PowerShell:

```powershell
Copy-Item envs/.env.example envs/.env.development
```

Linux/macOS:

```bash
cp envs/.env.example envs/.env.development
```

Для персональных переопределений можно использовать
`envs/.env.development.local`. Этот файл имеет больший приоритет и не попадает в Git.

## Запуск

```bash
npm run start:dev
```

После запуска:

- liveness endpoint: `GET http://localhost:3424/health`;
- Swagger UI: `http://localhost:3424/api`, если `ENABLE_SWAGGER=true`;
- OpenAPI JSON: `http://localhost:3424/api-json`.

Production-режим:

```bash
npm run build
npm run start:prod
```

Отладка с watch:

```bash
npm run start:debug
```

## Команды качества

| Команда                | Назначение                                              |
| ---------------------- | ------------------------------------------------------- |
| `npm run check`        | Проверить линтинг и форматирование Biome                |
| `npm run check:fix`    | Применить безопасные исправления Biome                  |
| `npm run typecheck`    | Выполнить строгую проверку TypeScript без генерации кода |
| `npm test`             | Собрать проект и запустить unit/smoke tests             |
| `npm run audit:prod`   | Проверить production-зависимости                        |
| `npm run verify`       | Выполнить все обязательные проверки                     |
| `npm run format:write` | Отформатировать поддерживаемые файлы                    |

Тесты проверяют безопасные значения конфигурации, нормализацию request IDs, health endpoint,
Helmet-заголовки, CORS по умолчанию и единый формат HTTP-ошибок.

## Конфигурация

Переменные загружаются в следующем порядке:

1. переменные процесса;
2. `envs/.env.${NODE_ENV}.local`;
3. `envs/.env.${NODE_ENV}`;
4. безопасные значения по умолчанию из `src/configs/constants.ts`.

Joi валидирует и преобразует конфигурацию до запуска приложения.

| Переменная               | По умолчанию    | Описание                                                    |
| ------------------------ | --------------- | ----------------------------------------------------------- |
| `APP_NAME`               | `nest-cli-lite` | Имя приложения в логах и OpenAPI                            |
| `PORT`                   | `3424`          | HTTP-порт                                                   |
| `NODE_ENV`               | `development`   | `development`, `production` или `test`                      |
| `ENABLE_SWAGGER`         | `false`         | Включить Swagger UI и OpenAPI JSON                          |
| `ENABLE_REQUEST_LOGGING` | `true`          | Логировать начало и завершение HTTP-запросов                |
| `ALLOWED_ORIGINS`        | _(пусто)_       | Origin-ы через запятую; пусто отключает cross-origin CORS   |
| `CORS_CREDENTIALS`       | `false`         | Разрешить credentials только для явного списка origin-ов    |

`envs/.env.example` предназначен для разработки и явно включает Swagger. Без env-файла
production-запуск использует безопасное значение `ENABLE_SWAGGER=false`.

### CORS

По умолчанию cross-origin-доступ выключен. Пример явного списка:

```dotenv
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
CORS_CREDENTIALS=true
```

`ALLOWED_ORIGINS=*` разрешён только при `CORS_CREDENTIALS=false`. Приложение откажется
запускаться с credentials и пустым списком либо wildcard.

## HTTP-ошибки и идентификаторы запросов

Клиент может передать `X-Correlation-Id` и `X-Request-Id`. Принимаются только значения длиной
до 128 символов из букв, цифр, `.`, `_`, `:`, `-`. Некорректный correlation ID заменяется UUID.

Пример ответа:

```json
{
  "statusCode": 404,
  "message": "Cannot GET /missing",
  "error": "Not Found",
  "correlationId": "7f64c3d7-3b67-4eaf-9687-86f6c81db452",
  "timestamp": "2026-07-24T12:00:00.000Z",
  "path": "/missing"
}
```

Необработанные ошибки всегда скрываются за сообщением `Internal server error`; подробности
попадают только в stderr. Входные значения нормализуются перед записью в однострочный лог.

## CLI

CLI использует тот же `AppModule` через `nest-commander`.

```bash
npm run cli:dev -- send-message

npm run build
npm run cli -- send-message
```

`send-message` — нейтральная демонстрационная команда без прикладной логики.

## Docker

```bash
docker compose up -d --build
docker compose ps
```

Production image:

- собирается в отдельном builder stage;
- устанавливает runtime-зависимости через `npm ci --omit=dev`;
- не содержит исходники, тесты, `.git` и env-файлы;
- запускает `node dist/main.js` от пользователя `node`;
- проверяет `GET /health`.

`docker-compose.yml` опционально читает `envs/.env.production` на этапе запуска контейнера.
Файл не встраивается в образ.

## Структура

```text
src/
├── configs/                 # Joi-схема и строго типизированный AppConfigService
├── logger/                  # AsyncLocalStorage, logger, middleware, interceptor, filter
├── setup/                   # Helmet, CORS и Swagger
├── app.module.ts            # Корневой модуль и глобальный ValidationPipe
├── health.controller.ts     # Liveness endpoint
├── main.ts                  # HTTP entrypoint
├── cli.ts                   # CLI entrypoint
└── send-message.command.ts  # Демонстрационная CLI-команда
test/
├── application.e2e.test.js  # HTTP smoke test
└── config.test.js           # Конфигурация и request IDs
envs/
└── .env.example             # Пример development-конфигурации
```

## Перед использованием в production

- создайте отдельный проект на основе шаблона;
- задайте `APP_NAME`, `NODE_ENV=production` и разрешённые origin-ы;
- храните секреты во внешнем secret manager или переменных окружения;
- оставьте Swagger выключенным, если он не нужен;
- настройте доверенные reverse proxy на уровне Express только под известную инфраструктуру;
- выполните `npm run verify` и соберите свежий Docker image.

## Лицензия

UNLICENSED

## Автор

Maksim Shuklin
