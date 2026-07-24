import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { AppConfigService } from './configs/config.service';
import { APPLICATION_LOGGER, type CustomLoggerService } from './logger/logger.module';
import { setupApplication } from './setup/application.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const appConfigService = app.get(AppConfigService);
  const port = appConfigService.port;
  const appLogger = app.get<CustomLoggerService>(APPLICATION_LOGGER);

  app.useLogger(appLogger);
  app.enableShutdownHooks();
  setupApplication(app, appConfigService);

  await app.listen(port);

  appLogger.log(`server started on port=${port}`);
  appLogger.log(`api base url http://localhost:${port}`);
  if (appConfigService.enableSwagger) {
    appLogger.log(`swagger available at http://localhost:${port}/api`);
  }
}

bootstrap().catch(error => {
  process.stderr.write(
    `Failed to bootstrap application: ${error instanceof Error ? error.stack : error}\n`,
  );
  process.exit(1);
});
