import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { getConfigModuleOptions } from './configs/config.module';
import { ExampleController } from './example.controller';
import { LoggerModule } from './logger/logger.module';
import { CorrelationMiddleware, GlobalExceptionFilter, HttpLoggingInterceptor } from './logger/logger.module';

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

