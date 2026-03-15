import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppConfigService } from './configs/config.service';
import {
  CustomLoggerService,
  GlobalExceptionFilter,
  HttpLoggingInterceptor,
  RequestContextProvider,
} from './logger/logger.module';
import { setupSwagger } from './setup/swagger.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const appConfigService = app.get(AppConfigService);
  const port = appConfigService.port;
  const requestContextProvider = app.get(RequestContextProvider);

  const appLogger = new CustomLoggerService(
    {
      category: 'application',
      context: 'bootstrap',
    },
    requestContextProvider,
  );

  app.useLogger(appLogger);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (appConfigService.enableRequestLogging) {
    app.useGlobalInterceptors(new HttpLoggingInterceptor(requestContextProvider));
  }

  app.useGlobalFilters(new GlobalExceptionFilter(requestContextProvider));

  setupSwagger(app, appConfigService);

  await app.listen(port);

  appLogger.log(`server started on port=${port}`);
  appLogger.log(`swagger available at http://localhost:${port}/api`);
  appLogger.log(`api base url http://localhost:${port}`);
}

bootstrap();
