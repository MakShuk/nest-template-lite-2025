import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupSwagger } from './setup/swagger.setup';

/**
 * Основная функция запуска приложения
 */
async function bootstrap(): Promise<void> {
  const port = Number(process.env.BACKEND_PORT) || 5686;

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

  // Настройка Swagger документации
  setupSwagger(app);

  await app.listen(port);
}

bootstrap();
