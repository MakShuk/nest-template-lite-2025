import { type INestApplication, Logger } from '@nestjs/common';

import type { AppConfigService } from '../configs/config.service';

export function setupCors(app: INestApplication, appConfigService: AppConfigService): void {
  const logger = new Logger('cors');
  const allowedOrigins = appConfigService.allowedOrigins;
  const allowAllOrigins = allowedOrigins.includes('*');
  const credentials = appConfigService.corsCredentials;

  logger.debug(`config allowedOrigins=${JSON.stringify(allowedOrigins)}`);

  if (credentials && (allowedOrigins.length === 0 || allowAllOrigins)) {
    throw new Error(
      'CORS_CREDENTIALS=true requires an explicit ALLOWED_ORIGINS list without a wildcard',
    );
  }

  const originOption = allowAllOrigins
    ? '*'
    : allowedOrigins.length > 0
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
      : false;

  app.enableCors({
    origin: originOption,
    credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Correlation-Id',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Correlation-Id', 'X-Request-Id'],
    maxAge: 86400,
  });

  logger.log('cors setup completed');
}
