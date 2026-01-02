import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, Scope } from '@nestjs/common';

import type { RequestContext } from './types';

/**
 * Провайдер для хранения request-scoped контекста через AsyncLocalStorage
 * Позволяет получать correlationId/requestId из любого места в коде в рамках одного запроса
 */
@Injectable({ scope: Scope.DEFAULT })
export class RequestContextProvider {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * Запускает новый контекст для запроса
   */
  run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Получает текущий контекст запроса
   */
  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Получает correlationId из текущего контекста
   */
  getCorrelationId(): string {
    return this.getContext()?.correlationId ?? 'unknown';
  }

  /**
   * Получает requestId из текущего контекста
   */
  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }
}
