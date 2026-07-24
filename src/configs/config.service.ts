import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from './config.schema';
import type { ENV_VALUES } from './constants';

type NodeEnvironment =
  (typeof ENV_VALUES.NODE_ENVIRONMENTS)[keyof typeof ENV_VALUES.NODE_ENVIRONMENTS];

@Injectable()
export class AppConfigService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get projectName(): string {
    return this.configService.get('APP_NAME', { infer: true });
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get enableSwagger(): boolean {
    return this.configService.get('ENABLE_SWAGGER', { infer: true });
  }

  get enableRequestLogging(): boolean {
    return this.configService.get('ENABLE_REQUEST_LOGGING', { infer: true });
  }

  get allowedOrigins(): string[] {
    const raw = this.configService.get('ALLOWED_ORIGINS', { infer: true });

    return raw
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  }

  get corsCredentials(): boolean {
    return this.configService.get('CORS_CREDENTIALS', { infer: true });
  }
}
