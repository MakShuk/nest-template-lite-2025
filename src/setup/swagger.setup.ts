import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfigService } from '../configs/config.service';
import { ENV_VALUES } from '../configs/constants';

export function setupSwagger(app: INestApplication, appConfigService: AppConfigService): void {
  if (
    appConfigService.nodeEnv === ENV_VALUES.NODE_ENVIRONMENTS.DEVELOPMENT ||
    appConfigService.enableSwagger
  ) {
    const config = new DocumentBuilder()
      .setTitle(`${appConfigService.projectName} API`)
      .setDescription(`${appConfigService.projectName} API documentation`)
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
