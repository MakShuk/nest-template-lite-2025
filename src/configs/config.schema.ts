import Joi from 'joi';

import { ENV_VALUES } from './constants';

export interface EnvironmentVariables {
  APP_NAME: string;
  PORT: number;
  NODE_ENV: (typeof ENV_VALUES.NODE_ENVIRONMENTS)[keyof typeof ENV_VALUES.NODE_ENVIRONMENTS];
  ENABLE_SWAGGER: boolean;
  ENABLE_REQUEST_LOGGING: boolean;
  ALLOWED_ORIGINS: string;
  CORS_CREDENTIALS: boolean;
}

export const configValidationSchema = Joi.object<EnvironmentVariables>({
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

  CORS_CREDENTIALS: Joi.boolean()
    .default(ENV_VALUES.DEFAULT_VALUES.CORS_CREDENTIALS)
    .description('Allow browsers to send credentials in cross-origin requests'),

  ALLOWED_ORIGINS: Joi.when('CORS_CREDENTIALS', {
    is: true,
    // biome-ignore lint/suspicious/noThenProperty: Joi's conditional schema API requires this key.
    then: Joi.string()
      .trim()
      .pattern(/^(?!.*\*)\s*[^,\s]+(?:\s*,\s*[^,\s]+)*\s*$/)
      .required()
      .messages({
        'any.required': 'ALLOWED_ORIGINS is required when CORS_CREDENTIALS=true',
        'string.empty': 'ALLOWED_ORIGINS is required when CORS_CREDENTIALS=true',
        'string.pattern.base':
          'ALLOWED_ORIGINS must contain an explicit comma-separated list without wildcards when CORS_CREDENTIALS=true',
      }),
    otherwise: Joi.string().allow('').default(ENV_VALUES.DEFAULT_VALUES.ALLOWED_ORIGINS),
  }).description('Comma-separated list of allowed CORS origins (empty disables CORS)'),
});
