export const ENV_VALUES = {
  NODE_ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
  DEFAULT_VALUES: {
    APP_NAME: 'nest-cli-lite',
    PORT: 3424,
    NODE_ENV: 'development',
    ENABLE_SWAGGER: false,
    ENABLE_REQUEST_LOGGING: true,
    ALLOWED_ORIGINS: '',
    CORS_CREDENTIALS: false,
  },
} as const;
