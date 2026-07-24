import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type {
  ArgumentsHost,
  CallHandler,
  ExceptionFilter,
  ExecutionContext,
  InjectionToken,
  NestInterceptor,
  LoggerService as NestLoggerService,
  NestMiddleware,
  Provider,
} from '@nestjs/common';
import {
  Catch,
  Global,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Module,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { type Observable, tap } from 'rxjs';

import { AppConfigModule } from '../configs/app-config.module';
import { AppConfigService } from '../configs/config.service';
import type { CreateLoggerOptions, RequestContext } from './logger.types';

const REQUEST_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_LOG_VALUE_LENGTH = 4_000;

export const LOGGER_TOKEN = (
  category: string,
  context?: string,
): InjectionToken<NestLoggerService> => `Logger:${category}:${context ?? 'default'}`;

export const APPLICATION_LOGGER = LOGGER_TOKEN('application', 'bootstrap');

export function InjectLogger(category: string, context?: string): ParameterDecorator {
  return Inject(LOGGER_TOKEN(category, context));
}

export function normalizeRequestIdentifier(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized || !REQUEST_IDENTIFIER_PATTERN.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function sanitizeLogValue(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').slice(0, MAX_LOG_VALUE_LENGTH);
}

function getClientIp(request: Request): string {
  // Express resolves trusted proxies into request.ip when an application explicitly enables them.
  return sanitizeLogValue(request.ip || request.socket.remoteAddress || 'unknown');
}

function getExceptionStatus(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  if (typeof exception === 'object' && exception !== null && 'status' in exception) {
    const status = exception.status;
    if (typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599) {
      return status;
    }
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

@Injectable()
export class RequestContextProvider {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getCorrelationId(): string {
    return this.getContext()?.correlationId ?? 'unknown';
  }

  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = normalizeRequestIdentifier(request.get('X-Request-Id'));
    const correlationId =
      normalizeRequestIdentifier(request.get('X-Correlation-Id')) ?? requestId ?? randomUUID();

    this.requestContextProvider.run({ correlationId, requestId }, () => {
      response.setHeader('X-Correlation-Id', correlationId);
      if (requestId) {
        response.setHeader('X-Request-Id', requestId);
      }

      next();
    });
  }
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private readonly options: CreateLoggerOptions;
  private readonly categoryWidth = 20;
  private readonly useColors = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
  private readonly reset = '\x1b[0m';
  private readonly levelColors: Record<'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE', string> = {
    TRACE: '\x1b[34m',
    DEBUG: '\x1b[36m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };

  constructor(
    options: CreateLoggerOptions,
    private readonly requestContextProvider: RequestContextProvider,
    private readonly appName: string,
  ) {
    // Clone options so setContext cannot mutate an object owned by a module definition.
    this.options = { ...options };
  }

  private safeStringify(value: unknown): string {
    try {
      const serialized = JSON.stringify(value, (_key, nestedValue: unknown) =>
        typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
      );
      return serialized ?? String(value);
    } catch {
      return '[unserializable]';
    }
  }

  private stringifyMessage(message: unknown): string {
    if (message instanceof Error) {
      return message.stack ?? message.message;
    }

    if (typeof message === 'string') {
      return message;
    }

    return this.safeStringify(message);
  }

  private isStackLike(value: string): boolean {
    return value.includes('\n') || value.startsWith('Error:') || value.includes(' at ');
  }

  private buildRequestPrefix(): string {
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();
    const tokens = [String(process.pid)];

    if (correlationId !== 'unknown') {
      tokens.push(correlationId);
    }
    if (requestId) {
      tokens.push(requestId);
    }

    return tokens.map(value => `[${sanitizeLogValue(value)}]`).join('');
  }

  private splitOptionalParams(optionalParams: unknown[]): { context?: string; extras: unknown[] } {
    if (optionalParams.length === 0) {
      return { extras: [] };
    }

    const params = [...optionalParams];
    const possibleContext = params.at(-1);
    if (typeof possibleContext === 'string' && !this.isStackLike(possibleContext)) {
      params.pop();
      return { context: possibleContext, extras: params };
    }

    return { extras: params };
  }

  private normalizeExtras(extras: unknown[]): string {
    return extras
      .filter(value => value !== undefined)
      .map(value => (typeof value === 'string' ? value : this.safeStringify(value)))
      .map(sanitizeLogValue)
      .filter(Boolean)
      .join(' ');
  }

  private write(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE',
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const { context, extras } = this.splitOptionalParams(optionalParams);
    const category = sanitizeLogValue(context ?? this.options.context ?? this.options.category)
      .slice(0, 40)
      .padStart(this.categoryWidth, ' ');
    const levelBlock = `[${level}]`.padStart(7, ' ');
    const requestPrefix = this.buildRequestPrefix();
    const messageText = sanitizeLogValue(this.stringifyMessage(message));
    const extraText = this.normalizeExtras(extras);
    const payload = [requestPrefix, messageText, extraText].filter(Boolean).join(' ');
    const plainPrefix = `[${sanitizeLogValue(this.appName)}][${new Date().toISOString()}] ${levelBlock} ${category} -`;
    const color = this.levelColors[level];
    const coloredPrefix =
      this.useColors && color ? `${color}${plainPrefix}${this.reset}` : plainPrefix;
    const stream = level === 'ERROR' ? process.stderr : process.stdout;

    stream.write(`${coloredPrefix} ${payload}\n`);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('INFO', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('ERROR', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('WARN', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('DEBUG', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('TRACE', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('ERROR', message, optionalParams);
  }

  setContext(context: string): void {
    this.options.context = context;
  }
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('http');

  constructor(
    private readonly requestContextProvider: RequestContextProvider,
    private readonly appConfigService: AppConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.appConfigService.enableRequestLogging || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const method = sanitizeLogValue(request.method);
    const path = sanitizeLogValue(request.path);
    const userAgent = sanitizeLogValue(request.get('User-Agent') ?? 'unknown');
    const clientIp = getClientIp(request);
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();
    const requestIdPart = requestId ? ` requestId=${requestId}` : '';
    const startMessage = `${method} ${path} request ip=${clientIp} ua="${userAgent}" correlationId=${correlationId}${requestIdPart}`;

    if (path === '/health' || path === '/ping') {
      this.logger.debug(startMessage);
    } else {
      this.logger.log(startMessage);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const message = `${method} ${path} response status=${statusCode} durationMs=${duration} ip=${clientIp}`;

          if (statusCode >= 500) {
            this.logger.error(message);
          } else if (statusCode >= 400) {
            this.logger.warn(message);
          } else {
            this.logger.log(message);
          }
        },
        error: (exception: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = getExceptionStatus(exception);
          const errorMessage =
            exception instanceof Error ? sanitizeLogValue(exception.message) : 'Unknown error';
          const message = `${method} ${path} response_error status=${statusCode} durationMs=${duration} ip=${clientIp} error="${errorMessage}"`;
          this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
        },
      }),
    );
  }
}

interface PublicError {
  message: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('exceptions');

  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();
    const clientIp = getClientIp(request);
    const status = getExceptionStatus(exception);
    const errorInfo = this.getErrorInfo(exception);
    const requestIdPart = requestId ? ` requestId=${requestId}` : '';
    const logMessage = `${sanitizeLogValue(request.method)} ${sanitizeLogValue(request.path)} failed status=${status} ip=${clientIp} correlationId=${correlationId}${requestIdPart} error=${sanitizeLogValue(errorInfo.name)}: ${sanitizeLogValue(errorInfo.message)}`;

    if (status >= 500) {
      this.logger.error(logMessage, errorInfo.stack);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      ...this.getPublicError(exception),
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.path,
    });
  }

  private getPublicError(exception: unknown): PublicError {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error' };
    }

    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    const responseRecord = exceptionResponse as Record<string, unknown>;
    const messageCandidate = responseRecord.message;
    const errorCandidate = responseRecord.error;
    let message: string | string[] = exception.message;

    if (typeof messageCandidate === 'string') {
      message = messageCandidate;
    } else if (Array.isArray(messageCandidate)) {
      const messages = messageCandidate.filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) {
        message = messages;
      }
    }

    return typeof errorCandidate === 'string' ? { message, error: errorCandidate } : { message };
  }

  private getErrorInfo(exception: unknown): {
    name: string;
    message: string;
    stack?: string | undefined;
  } {
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

function createLoggerProvider(
  token: InjectionToken<NestLoggerService>,
  options: CreateLoggerOptions,
): Provider {
  return {
    provide: token,
    useFactory: (
      requestContextProvider: RequestContextProvider,
      appConfigService: AppConfigService,
    ) => new CustomLoggerService(options, requestContextProvider, appConfigService.projectName),
    inject: [RequestContextProvider, AppConfigService],
  };
}

const applicationLoggerProvider = createLoggerProvider(APPLICATION_LOGGER, {
  category: 'application',
  context: 'bootstrap',
});

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    RequestContextProvider,
    applicationLoggerProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [RequestContextProvider, APPLICATION_LOGGER],
})
export class LoggerModule {
  static registerLogger(options: CreateLoggerOptions): Provider {
    return createLoggerProvider(LOGGER_TOKEN(options.category, options.context), options);
  }

  static registerLoggers(optionsList: CreateLoggerOptions[]): Provider[] {
    return optionsList.map(options => LoggerModule.registerLogger(options));
  }
}
