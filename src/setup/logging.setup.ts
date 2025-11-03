import { type INestApplication, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Настройка middleware для логирования запросов
 */
export function setupRequestLogging(app: INestApplication): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const EnableRequestLogging = !isProduction && process.env.ENABLE_REQUEST_LOGGING === 'true';

  if (EnableRequestLogging) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const { method, originalUrl } = req;
      const userAgent = req.get('User-Agent') || 'Unknown';

      // Получаем реальный IP адрес клиента
      const realIp =
        req.get('X-Forwarded-For') ||
        req.get('X-Real-IP') ||
        req.socket.remoteAddress ||
        req.ip ||
        'Unknown';

      // Логируем входящий запрос с более детальной информацией об IP
      Logger.log(
        `📥 ${method} ${originalUrl} - 🌐 IP: ${realIp} - 🖥️ UserAgent: ${userAgent}`,
        'RequestLogger',
      );

      // Перехватываем ответ
      const originalSend = res.send;
      res.send = function (body) {
        const duration = Date.now() - startTime;
        const { statusCode } = res;

        // Определяем цвет статуса для красивого вывода
        const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';

        Logger.log(
          `📤 ${method} ${originalUrl} - 🌐 IP: ${realIp} - ${statusColor} ${statusCode} - ⏱️ ${duration}ms`,
          'RequestLogger',
        );

        return originalSend.call(this, body);
      };

      next();
    });

    Logger.log('🔍 Логирование запросов включено', 'RequestLogger');
  } else {
    Logger.log('🔇 Логирование запросов отключено', 'RequestLogger');
  }
}

/**
 * Логирование информации о запуске сервера
 */
export function logServerInfo(port: number): void {
  Logger.log(`🚀 Сервер запущен на порту ${port}`);
  Logger.log(`🌍 Режим работы: ${process.env.NODE_ENV || 'development'}`);

  if (process.env.NODE_ENV === 'development') {
    Logger.log(`📝 Swagger документация доступна по адресу: http://localhost:${port}/api`);
  }
}
