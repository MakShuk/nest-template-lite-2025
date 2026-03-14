import { type INestApplication, Logger } from '@nestjs/common';

export function setupCors(app: INestApplication): void {
  const logger = new Logger('cors');
  const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? '';
  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  logger.debug(`config allowedOrigins=${JSON.stringify(allowedOrigins)}`);

  const originOption =
    allowedOrigins.length > 0
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin) {
            logger.debug('request without origin, allow=true');
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            logger.debug(`origin allowed origin=${origin}`);
            return callback(null, true);
          }

          logger.warn(`origin denied origin=${origin}`);
          return callback(new Error('CORS: Origin is not allowed'));
        }
      : true;

  app.enableCors({
    origin: originOption,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400,
  });

  logger.log('cors setup completed');
}
