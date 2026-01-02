import { InjectionToken } from '@nestjs/common';

import type { CreateLoggerOptions } from './types';

/**
 * Создаёт токен DI для категоризированного логгера
 */
export const LOGGER_TOKEN = (
  category: string,
  context?: string,
): InjectionToken<CreateLoggerOptions> =>
  `Logger:${category}:${context ?? 'default'}` as unknown as InjectionToken<CreateLoggerOptions>;
