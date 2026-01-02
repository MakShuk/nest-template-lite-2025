import { Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from './logger.constants';

/**
 * Декоратор для инъекции категоризированного логгера
 * @param category Категория логгера (например, имя модуля/подсистемы)
 * @param context Опциональный контекст (имя класса)
 */
export function InjectLogger(category: string, context?: string): ParameterDecorator {
  return Inject(LOGGER_TOKEN(category, context));
}
