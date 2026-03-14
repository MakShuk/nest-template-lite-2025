import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  Global,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  InjectionToken,
  Logger,
  LoggerService as NestLoggerService,
  Module,
  NestInterceptor,
  NestMiddleware,
  Provider,
  Scope,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CreateLoggerOptions {
  category: string;
  context?: string;
}

export interface RequestContext {
  correlationId: string;
  requestId?: string | undefined;
}

export const LOGGER_TOKEN = (
  category: string,
  context?: string,
): InjectionToken<CreateLoggerOptions> =>
  `Logger:${category}:${context ?? 'default'}` as unknown as InjectionToken<CreateLoggerOptions>;

export function InjectLogger(category: string, context?: string): ParameterDecorator {
  return Inject(LOGGER_TOKEN(category, context));
}

@Injectable({ scope: Scope.DEFAULT })
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

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = req.get('X-Correlation-Id') || req.get('X-Request-Id') || randomUUID();
    const requestId = req.get('X-Request-Id') || undefined;

    this.requestContextProvider.run({ correlationId, requestId }, () => {
      res.setHeader('X-Correlation-Id', correlationId);
      if (requestId) {
        res.setHeader('X-Request-Id', requestId);
      }

      next();
    });
  }
}

@Injectable({ scope: Scope.DEFAULT })
export class CustomLoggerService implements NestLoggerService {
  private readonly appName = process.env.APP_NAME ?? 'app';
  private readonly categoryWidth = 20;
  private readonly useColors = !process.env.NO_COLOR;
  private readonly reset = '\x1b[0m';
  private readonly levelColors: Record<'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE', string> = {
    TRACE: '\x1b[34m',
    DEBUG: '\x1b[36m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };

  constructor(
    private readonly options: CreateLoggerOptions,
    private readonly requestContextProvider: RequestContextProvider,
  ) {}

  private formatTimestamp(): string {
    return new Date().toISOString().slice(0, 23);
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }

  private stringifyMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }

    return this.safeStringify(message);
  }

  private isStackLike(value: string): boolean {
    return value.includes('\n') || value.startsWith('Error:') || value.includes(' at ');
  }

  private buildPrefix(): string {
    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    const tokens = [String(process.pid)];
    if (correlationId && correlationId !== 'unknown') {
      tokens.push(correlationId);
    }
    if (requestId) {
      tokens.push(requestId);
    }

    return tokens.map(value => `[${value}]`).join('');
  }

  private splitOptionalParams(optionalParams: unknown[]): { context?: string; extras: unknown[] } {
    if (optionalParams.length === 0) {
      return { extras: [] };
    }

    const params = [...optionalParams];
    const possibleContext = params[params.length - 1];
    if (typeof possibleContext === 'string' && !this.isStackLike(possibleContext)) {
      params.pop();
      return { context: possibleContext, extras: params };
    }

    return { extras: params };
  }

  private normalizeExtras(extras: unknown[]): string {
    if (extras.length === 0) {
      return '';
    }

    return extras
      .map(value => (typeof value === 'string' ? value : this.safeStringify(value)))
      .filter(Boolean)
      .join(' ');
  }

  private write(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE',
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const { context, extras } = this.splitOptionalParams(optionalParams);
    const category = (context ?? this.options.context ?? this.options.category).padStart(
      this.categoryWidth,
      ' ',
    );
    const levelBlock = `[${level}]`.padStart(7, ' ');
    const requestPrefix = this.buildPrefix();
    const extraText = this.normalizeExtras(extras);
    const messageText = this.stringifyMessage(message);
    const payload = [requestPrefix, messageText, extraText].filter(Boolean).join(' ');

    const plainPrefix = `[${this.appName}][${this.formatTimestamp()}] ${levelBlock} ${category} -`;
    const color = this.levelColors[level];
    const coloredPrefix = this.useColors && color ? `${color}${plainPrefix}${this.reset}` : plainPrefix;
    const line = `${coloredPrefix} ${payload}`;

    const stream = level === 'ERROR' ? process.stderr : process.stdout;
    stream.write(`${line}\n`);
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

  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    const { method, url } = request;
    const userAgent = request.get('User-Agent') || 'unknown';

    const realIp =
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown';

    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    const requestIdPart = requestId ? ` requestId=${requestId}` : '';
    const startMessage = `${method} ${url} request ip=${realIp} ua="${userAgent}" correlationId=${correlationId}${requestIdPart}`;

    if (url.includes('/health') || url.includes('/ping')) {
      this.logger.debug(startMessage);
    } else {
      this.logger.log(startMessage);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const message = `${method} ${url} response status=${statusCode} durationMs=${duration} ip=${realIp}`;

          if (statusCode >= 500) {
            this.logger.error(message);
          } else if (statusCode >= 400) {
            this.logger.warn(message);
          } else {
            this.logger.log(message);
          }
        },
        error: error => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const message = `${method} ${url} response_error status=${statusCode} durationMs=${duration} ip=${realIp} error="${error.message}"`;
          this.logger.error(message);
        },
      }),
    );
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('exceptions');

  constructor(private readonly requestContextProvider: RequestContextProvider) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = this.requestContextProvider.getCorrelationId();
    const requestId = this.requestContextProvider.getRequestId();

    const realIp =
      request.get('X-Forwarded-For') ||
      request.get('X-Real-IP') ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const errorInfo = this.getErrorInfo(exception);
    const requestIdPart = requestId ? ` requestId=${requestId}` : '';
    const logMessage = `${request.method} ${request.url} failed status=${status} ip=${realIp} correlationId=${correlationId}${requestIdPart} error=${errorInfo.name}: ${errorInfo.message}`;

    if (status >= 500) {
      this.logger.error(logMessage, errorInfo.stack);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    });
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

@Global()
@Module({
  providers: [RequestContextProvider],
  exports: [RequestContextProvider],
})
export class LoggerModule {
  static registerLogger(options: CreateLoggerOptions): Provider {
    return {
      provide: LOGGER_TOKEN(options.category, options.context),
      useFactory: (requestContextProvider: RequestContextProvider) =>
        new CustomLoggerService(options, requestContextProvider),
      inject: [RequestContextProvider],
    };
  }

  static registerLoggers(optionsList: CreateLoggerOptions[]): Provider[] {
    return optionsList.map(options => LoggerModule.registerLogger(options));
  }
}
