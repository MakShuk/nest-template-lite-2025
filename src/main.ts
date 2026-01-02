import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './logger/global-exception.filter';
import { HttpLoggingInterceptor } from './logger/http-logging.interceptor';
import { RequestContextProvider } from './logger/request-context.provider';
import { setupSwagger } from './setup/swagger.setup';

/**
 * Основная функция запуска приложения
 */
async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT) || 5664;

  const app = await NestFactory.create(AppModule);

  // Настройка глобального ValidationPipe с трансформацией для input sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Включаем трансформацию для работы декораторов @Transform
      transformOptions: {
        enableImplicitConversion: true, // Автоматическое преобразование типов
      },
      whitelist: true, // Удаляем свойства, не описанные в DTO
      forbidNonWhitelisted: true, // Выбрасываем ошибку при наличии недопустимых свойств
    }),
  );

  // Настройка глобального HTTP Logging Interceptor
  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    app.useGlobalInterceptors(new HttpLoggingInterceptor(app.get(RequestContextProvider)));
  }

  // Настройка глобального Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(RequestContextProvider)));

  // Настройка Swagger документации
  setupSwagger(app);

  await app.listen(port);

  // Отображение информации о запуске
  console.log(`🚀 Сервер запущен на порту: ${port}`);
  console.log(`📖 Документация Swagger доступна по адресу: http://localhost:${port}/api`);
  console.log(`🌐 Базовый URL API: http://localhost:${port}`);
}

bootstrap();
