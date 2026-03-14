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
    this.logger.log('РџСЂРёРјРµСЂ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ info СѓСЂРѕРІРЅСЏ', { userId: 123, action: 'getExample' });
    this.logger.debug('РћС‚Р»Р°РґРѕС‡РЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ', { debugData: { nested: { value: 42 } } });
    this.logger.warn('РџСЂРµРґСѓРїСЂРµР¶РґРµРЅРёРµ Рѕ С‡РµРј-С‚Рѕ', { warningCode: 'EXAMPLE_001' });

    return { message: 'Hello from ExampleController!' };
  }

  @Get('error')
  getErrorExample(): void {
    this.logger.error('РџСЂРёРјРµСЂ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ РѕС€РёР±РєРё', 'stack-trace-here', {
      errorContext: { field: 'value' },
    });

    throw new Error('Р­С‚Рѕ РїСЂРёРјРµСЂ РёСЃРєР»СЋС‡РµРЅРёСЏ');
  }
}

