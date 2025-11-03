import * as Joi from 'joi';

import { ENV_VALUES } from './constants';

export const configValidationSchema = Joi.object({
  PORT: Joi.number()
    .port()
    .default(ENV_VALUES.DEFAULT_VALUES.PORT)
    .description('Application port number'),

  NODE_ENV: Joi.string()
    .valid(...Object.values(ENV_VALUES.NODE_ENVIRONMENTS))
    .default(ENV_VALUES.DEFAULT_VALUES.NODE_ENV)
    .description('Node environment'),

  ENABLE_SWAGGER: Joi.boolean()
    .default(ENV_VALUES.DEFAULT_VALUES.ENABLE_SWAGGER)
    .description('Enable Swagger documentation'),
});
