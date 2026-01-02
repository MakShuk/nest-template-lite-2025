import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { RequestContextProvider } from './request-context.provider';
import type { RequestContext } from './types';

/**
 * Middleware для обработки X-Correlation-Id и X-Request-Id
 * Генерирует новые значения если отсутствуют и сохраняет в AsyncLocalStorage
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = this.getOrGenerateCorrelationId(req);
    const requestId = this.getRequestId(req);

    // Сохраняем в AsyncLocalStorage для всего жизненного цикла запроса
    const context: RequestContext = { correlationId, requestId };

    this.requestContextProvider.run(context, () => {
      // Добавляем заголовки в ответ для трассировки
      res.setHeader('X-Correlation-Id', correlationId);
      if (requestId) {
        res.setHeader('X-Request-Id', requestId);
      }

      next();
    });
  }

  /**
   * Получает X-Correlation-Id из запроса или генерирует новый
   */
  private getOrGenerateCorrelationId(req: Request): string {
    return req.get('X-Correlation-Id') || req.get('X-Request-Id') || randomUUID();
  }

  /**
   * Получает X-Request-Id из запроса (опционально)
   */
  private getRequestId(req: Request): string | undefined {
    return req.get('X-Request-Id') || undefined;
  }
}
