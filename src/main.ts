import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
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

  // Настройка Swagger документации
  setupSwagger(app);

  await app.listen(port);

  // Отображение информации о запуске
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Сервер запущен на порту: ${port}`);
  console.log(`📖 Документация Swagger доступна по адресу: ${baseUrl}/api`);
  console.log(`🌐 Базовый URL API: ${baseUrl}`);
}

bootstrap();
