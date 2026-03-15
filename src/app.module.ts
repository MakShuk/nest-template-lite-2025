import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigModule } from './configs/app-config.module';
import { getConfigModuleOptions } from './configs/config.module';
import { ExampleController } from './example.controller';
import { HelloCommand } from './hello.command';
import {
  CorrelationMiddleware,
  GlobalExceptionFilter,
  HttpLoggingInterceptor,
  LoggerModule,
} from './logger/logger.module';
import { SendMessageCommand } from './send-message.command';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot(getConfigModuleOptions()),
    AppConfigModule,
    LoggerModule,
    TelegramModule,
  ],
  controllers: [ExampleController],
  providers: [
    HelloCommand,
    SendMessageCommand,
    GlobalExceptionFilter,
    HttpLoggingInterceptor,
    LoggerModule.registerLogger({ category: 'ExampleModule', context: 'ExampleController' }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
