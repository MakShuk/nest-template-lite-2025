import { type INestApplication, Logger } from '@nestjs/common';

/**
 * Настройка CORS с учётом окружения и ALLOWED_ORIGINS
 */
export function setupCors(app: INestApplication): void {
  const logger = new Logger('CorsSetup');
  const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? '';
  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  logger.log(`[DEBUG] Setting up CORS with allowed origins: ${JSON.stringify(allowedOrigins)}`);

  const originOption =
    allowedOrigins.length > 0
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          const timestamp = new Date().toISOString();
          const requestId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

          logger.log(`[${requestId}] [DEBUG] CORS check for origin: ${origin || 'undefined'}`);

          if (!origin) {
            // Разрешаем запросы без Origin (например, от серверов/healthchecks)
            logger.log(`[${requestId}] [DEBUG] CORS: No origin provided, allowing request`);
            return callback(null, true);
          }
          if (allowedOrigins.includes(origin)) {
            logger.log(`[${requestId}] [DEBUG] CORS: Origin ${origin} is allowed`);
            return callback(null, true);
          }
          logger.error(
            `[${requestId}] [DEBUG] CORS: Origin ${origin} is not allowed. Allowed origins: ${JSON.stringify(allowedOrigins)}`,
          );
          return callback(new Error('CORS: Origin is not allowed'));
        }
      : true; // поведение по умолчанию (как было раньше)

  app.enableCors({
    origin: originOption,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400, // кэширование preflight на 24 часа
  });

  logger.log(
    `[DEBUG] CORS setup completed with credentials: true, methods: ${JSON.stringify(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])}`,
  );
}
