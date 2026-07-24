import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // This liveness endpoint intentionally checks only whether the Nest process can serve requests.
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
