import {
  ConsoleLogger,
  Injectable,
  LogLevel,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

import { RequestContextProvider } from './request-context.provider';
import type { CreateLoggerOptions, LogContext, LogEntry } from './types';

/**
 * Категоризированный логгер, совместимый с Nest LoggerService
 * Добавляет category, correlationId, requestId и структурированный context
 */
@Injectable({ scope: Scope.DEFAULT })
export class CustomLoggerService implements NestLoggerService {
  private readonly consoleLogger = new ConsoleLogger();

  constructor(
    private readonly options: CreateLoggerOptions,
    private readonly requestContextProvider: RequestContextProvider,
  ) {
    this.consoleLogger.setContext(options.context ?? options.category);
  }

  /**
   * Формирует структурированный лог-объект
   */
  private buildLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    return {
      timestamp: new Date().toISOString(),
      level,
      category: this.options.category,
      context: this.options.context ?? this.options.category,
      message,
      correlationId,
      requestId,
      data: context,
    };
  }

  /**
   * Форматирует лог для вывода в консоль
   */
  private formatLog(entry: LogEntry): string {
    const parts = [`[${entry.category}]`, entry.message];

    if (entry.correlationId) {
      parts.push(`correlationId=${entry.correlationId}`);
    }

    if (entry.requestId) {
      parts.push(`requestId=${entry.requestId}`);
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      parts.push(JSON.stringify(entry.data));
    }

    return parts.join(' ');
  }

  /**
   * Логирует сообщение на внутреннем уровне
   */
  private logInternal(level: LogLevel, message: string, context?: LogContext): void {
    const entry = this.buildLogEntry(level, message, context);
    const formatted = this.formatLog(entry);

    switch (level) {
      case 'log':
        this.consoleLogger.log(formatted);
        break;
      case 'verbose':
        this.consoleLogger.verbose(formatted);
        break;
      case 'debug':
        this.consoleLogger.debug(formatted);
        break;
      case 'warn':
        this.consoleLogger.warn(formatted);
        break;
      case 'error':
        this.consoleLogger.error(formatted);
        break;
      case 'fatal':
        this.consoleLogger.error(formatted);
        break;
    }
  }

  log(message: string, context?: LogContext): void {
    this.logInternal('log', message, context);
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const data = context ?? {};
    if (trace) {
      data.stack = trace;
    }
    this.logInternal('error', message, data);
  }

  warn(message: string, context?: LogContext): void {
    this.logInternal('warn', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.logInternal('debug', message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.logInternal('verbose', message, context);
  }

  /**
   * Устанавливает контекст логгера (имя класса)
   */
  setContext(context: string): void {
    this.options.context = context;
    this.consoleLogger.setContext(context);
  }
}
