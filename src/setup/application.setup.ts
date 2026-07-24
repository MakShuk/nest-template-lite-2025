import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import type { AppConfigService } from '../configs/config.service';
import { setupCors } from './cors.setup';
import { setupSwagger } from './swagger.setup';

export function setupApplication(
  app: NestExpressApplication,
  appConfigService: AppConfigService,
): void {
  // Swagger UI uses inline assets; other Helmet protections remain enabled when its CSP is relaxed.
  const helmetOptions = appConfigService.enableSwagger
    ? { contentSecurityPolicy: false as const }
    : {};
  app.use(helmet(helmetOptions));

  setupCors(app, appConfigService);
  setupSwagger(app, appConfigService);
}
