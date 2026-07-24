import { type MiddlewareConsumer, Module, type NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppConfigModule } from './configs/app-config.module';
import { getConfigModuleOptions } from './configs/config.module';

import { HealthController } from './health.controller';
import { CorrelationMiddleware, LoggerModule } from './logger/logger.module';
import { SendMessageCommand } from './send-message.command';

@Module({
  imports: [ConfigModule.forRoot(getConfigModuleOptions()), AppConfigModule, LoggerModule],
  controllers: [HealthController],
  providers: [
    SendMessageCommand,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          stopAtFirstError: false,
        }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
