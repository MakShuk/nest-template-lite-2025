import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { getConfigModuleOptions } from './configs/config.module';
import { LoggerModule } from './logger';
import { CorrelationMiddleware } from './logger/correlation.middleware';
import { ExampleController } from './logger/example.controller';
import { GlobalExceptionFilter } from './logger/global-exception.filter';
import { HttpLoggingInterceptor } from './logger/http-logging.interceptor';

@Module({
  imports: [ConfigModule.forRoot(getConfigModuleOptions()), LoggerModule],
  controllers: [ExampleController],
  providers: [
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
