export const ENV_VALUES = {
  NODE_ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  },
  DEFAULT_VALUES: {
    APP_NAME: 'nest-cli-tg',
    PORT: 3424,
    NODE_ENV: 'development',
    ENABLE_SWAGGER: true,
    ENABLE_REQUEST_LOGGING: true,
  },
} as const;
