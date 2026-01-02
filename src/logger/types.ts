import type { LogLevel } from '@nestjs/common';

/**
 * Контекст запроса для корреляции
 */
export interface RequestContext {
  correlationId: string;
  requestId?: string | undefined;
}

/**
 * Контекст лог-сообщения
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Структурированный формат лога
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  context: string;
  message: string;
  correlationId: string;
  requestId?: string | undefined;
  data?: LogContext | undefined;
}

/**
 * Опции создания категоризированного логгера
 */
export interface CreateLoggerOptions {
  category: string;
  context?: string;
}
