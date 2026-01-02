import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { RequestContextProvider } from './request-context.provider';

/**
 * Глобальный фильтр исключений для унифицированного логирования ошибок
 * Логирует непредвиденные исключения и возвращает безопасный HTTP-ответ
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    // Получаем реальный IP адрес
    const realIp =
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.socket.remoteAddress ||
      request.ip ||
      'Unknown';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const errorInfo = this.getErrorInfo(exception);

    // Логируем ошибку
    this.logError({
      method: request.method,
      url: request.url,
      statusCode: status,
      error: errorInfo,
      ip: realIp,
      correlationId,
      requestId,
    });

    // Возвращаем безопасный ответ
    response.status(status).json({
      statusCode: status,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }

  private logError(data: {
    method: string;
    url: string;
    statusCode: number;
    error: {
      name: string;
      message: string;
      stack?: string | undefined;
    };
    ip: string;
    correlationId: string;
    requestId?: string | undefined;
  }): void {
    const level = data.statusCode >= 500 ? 'error' : 'warn';
    const message = `❌ ${data.method} ${data.url} - ${data.statusCode} - ${data.error.name}: ${data.error.message}`;

    const context = {
      ip: data.ip,
      errorName: data.error.name,
      errorMessage: data.error.message,
      errorStack: data.error.stack,
      correlationId: data.correlationId,
      requestId: data.requestId,
    };

    this.logger[level](message, context);
  }

  private getErrorInfo(exception: unknown): {
    name: string;
    message: string;
    stack?: string | undefined;
  } {
    if (exception instanceof HttpException) {
      return {
        name: exception.constructor.name,
        message: exception.message,
      };
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    return {
      name: 'UnknownError',
      message: String(exception),
    };
  }
}
