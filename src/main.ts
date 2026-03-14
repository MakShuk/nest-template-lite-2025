import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupSwagger } from './setup/swagger.setup';
import {
  CustomLoggerService,
  GlobalExceptionFilter,
  HttpLoggingInterceptor,
  RequestContextProvider,
} from './logger/logger.module';

async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT) || 5664;

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
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

  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    app.useGlobalInterceptors(new HttpLoggingInterceptor(requestContextProvider));
  }

  app.useGlobalFilters(new GlobalExceptionFilter(requestContextProvider));

  setupSwagger(app);

  await app.listen(port);

  appLogger.log(`server started on port=${port}`);
  appLogger.log(`swagger available at http://localhost:${port}/api`);
  appLogger.log(`api base url http://localhost:${port}`);
}

bootstrap();
