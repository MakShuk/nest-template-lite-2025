import { Controller, Get } from '@nestjs/common';

import type { CustomLoggerService } from './logger/logger.module';
import { InjectLogger } from './logger/logger.module';

@Controller('example')
export class ExampleController {
  constructor(
    @InjectLogger('ExampleModule', 'ExampleController')
    private readonly logger: CustomLoggerService,
  ) {}

  @Get()
  getExample(): { message: string } {
    this.logger.log('Пример логирования info уровня', { userId: 123, action: 'getExample' });
    this.logger.debug('Отладочная информация', { debugData: { nested: { value: 42 } } });
    this.logger.warn('Предупреждение о чем-то', { warningCode: 'EXAMPLE_001' });

    return { message: 'Hello from ExampleController!' };
  }

  @Get('error')
  getErrorExample(): void {
    this.logger.error('Пример логирования ошибки', 'stack-trace-here', {
      errorContext: { field: 'value' },
    });

    throw new Error('Это пример исключения');
  }
}
