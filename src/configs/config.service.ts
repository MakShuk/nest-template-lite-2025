import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENV_VALUES } from "./constants";

type NodeEnvironment =
  (typeof ENV_VALUES.NODE_ENVIRONMENTS)[keyof typeof ENV_VALUES.NODE_ENVIRONMENTS];

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get projectName(): string {
    const appName = this.configService.get<string>("APP_NAME")?.trim();
    if (appName) {
      return appName;
    }

    return ENV_VALUES.DEFAULT_VALUES.APP_NAME;
  }

  get port(): number {
    return (
      this.configService.get<number>("PORT") ?? ENV_VALUES.DEFAULT_VALUES.PORT
    );
  }

  get nodeEnv(): NodeEnvironment {
    const nodeEnv = this.configService.get<NodeEnvironment>("NODE_ENV");
    return nodeEnv ?? ENV_VALUES.DEFAULT_VALUES.NODE_ENV;
  }

  get enableSwagger(): boolean {
    return (
      this.configService.get<boolean>("ENABLE_SWAGGER") ??
      ENV_VALUES.DEFAULT_VALUES.ENABLE_SWAGGER
    );
  }

  get enableRequestLogging(): boolean {
    return (
      this.configService.get<boolean>("ENABLE_REQUEST_LOGGING") ??
      ENV_VALUES.DEFAULT_VALUES.ENABLE_REQUEST_LOGGING
    );
  }
}
