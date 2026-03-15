import Joi from 'joi';

import { ENV_VALUES } from './constants';

export const configValidationSchema = Joi.object({
  APP_NAME: Joi.string()
    .trim()
    .min(1)
    .default(ENV_VALUES.DEFAULT_VALUES.APP_NAME)
    .description('Application name'),

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

  ENABLE_REQUEST_LOGGING: Joi.boolean()
    .default(ENV_VALUES.DEFAULT_VALUES.ENABLE_REQUEST_LOGGING)
    .description('Enable HTTP request/response logging'),
});
