import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigModule } from "./configs/app-config.module";
import { getConfigModuleOptions } from "./configs/config.module";

import {
  CorrelationMiddleware,
  GlobalExceptionFilter,
  HttpLoggingInterceptor,
  LoggerModule,
} from "./logger/logger.module";
import { SendMessageCommand } from "./send-message.command";

@Module({
  imports: [
    ConfigModule.forRoot(getConfigModuleOptions()),
    AppConfigModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [
    SendMessageCommand,
    GlobalExceptionFilter,
    HttpLoggingInterceptor,
    LoggerModule.registerLogger({
      category: "ExampleModule",
      context: "ExampleController",
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}
