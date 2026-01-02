import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { RequestContextProvider } from './request-context.provider';

/**
 * Interceptor для логирования HTTP запросов и ответов
 * Логирует method, url, statusCode, durationMs, ip, requestId, correlationId
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpLogger');

  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    const { method, url } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';

    // Получаем реальный IP адрес
    const realIp =
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.socket.remoteAddress ||
      request.ip ||
      'Unknown';

    // Получаем correlationId и requestId из контекста
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    // Логируем входящий запрос
    this.logRequest({
      method,
      url,
      ip: realIp,
      userAgent,
      correlationId,
      requestId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logResponse({
            method,
            url,
            statusCode,
            duration,
            ip: realIp,
            correlationId,
            requestId,
          });
        },
        error: error => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logError({
            method,
            url,
            statusCode,
            duration,
            error: error.message,
            ip: realIp,
            correlationId,
            requestId,
          });
        },
      }),
    );
  }

  private logRequest(data: {
    method: string;
    url: string;
    ip: string;
    userAgent: string;
    correlationId: string;
    requestId?: string | undefined;
  }): void {
    const level = this.getLogLevelForRequest(data.url);
    const message = `📥 ${data.method} ${data.url}`;

    const context = {
      ip: data.ip,
      userAgent: data.userAgent,
      correlationId: data.correlationId,
      requestId: data.requestId,
    };

    this.logger[level](message, context);
  }

  private logResponse(data: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    ip: string;
    correlationId: string;
    requestId?: string | undefined;
  }): void {
    const level = this.getLogLevelForResponse(data.statusCode);
    const statusEmoji = this.getStatusEmoji(data.statusCode);
    const message = `📤 ${data.method} ${data.url} ${statusEmoji} ${data.statusCode}`;

    const context = {
      durationMs: data.duration,
      ip: data.ip,
      correlationId: data.correlationId,
      requestId: data.requestId,
    };

    this.logger[level](message, context);
  }

  private logError(data: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    error: string;
    ip: string;
    correlationId: string;
    requestId?: string | undefined;
  }): void {
    const message = `❌ ${data.method} ${data.url} - ${data.statusCode} - ${data.error}`;

    const context = {
      durationMs: data.duration,
      ip: data.ip,
      error: data.error,
      correlationId: data.correlationId,
      requestId: data.requestId,
    };

    this.logger.error(message, context);
  }

  private getLogLevelForRequest(url: string): 'log' | 'debug' {
    // Health checks логируем на debug уровне
    if (url.includes('/health') || url.includes('/ping')) {
      return 'debug';
    }
    return 'log';
  }

  private getLogLevelForResponse(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode >= 400) {
      return 'warn';
    }
    return 'log';
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) return '🔴';
    if (statusCode >= 400) return '🟡';
    return '🟢';
  }
}
