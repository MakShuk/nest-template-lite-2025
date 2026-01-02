import { Global, Module, Provider } from '@nestjs/common';

import { CustomLoggerService } from './custom-logger.service';
import { LOGGER_TOKEN } from './logger.constants';
import { RequestContextProvider } from './request-context.provider';
import type { CreateLoggerOptions } from './types';

/**
 * Global модуль логирования
 * Предоставляет RequestContextProvider и фабрику для создания категоризированных логгеров
 */
@Global()
@Module({
  providers: [RequestContextProvider],
  exports: [RequestContextProvider],
})
export class LoggerModule {
  /**
   * Регистрирует категоризированный логгер
   * Используется для статической регистрации провайдеров логгеров
   */
  static registerLogger(options: CreateLoggerOptions): Provider {
    return {
      provide: LOGGER_TOKEN(options.category, options.context),
      useFactory: (requestContextProvider: RequestContextProvider) =>
        new CustomLoggerService(options, requestContextProvider),
      inject: [RequestContextProvider],
    };
  }

  /**
   * Регистрирует несколько категоризированных логгеров
   */
  static registerLoggers(optionsList: CreateLoggerOptions[]): Provider[] {
    return optionsList.map(options => LoggerModule.registerLogger(options));
  }
}
