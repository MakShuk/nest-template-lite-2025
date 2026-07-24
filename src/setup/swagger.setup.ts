import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { AppConfigService } from '../configs/config.service';

export function setupSwagger(app: INestApplication, appConfigService: AppConfigService): void {
  if (!appConfigService.enableSwagger) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle(`${appConfigService.projectName} API`)
    .setDescription(`${appConfigService.projectName} API documentation`)
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: `${appConfigService.projectName} API`,
    swaggerOptions: {
      displayRequestDuration: true,
    },
  });
}
