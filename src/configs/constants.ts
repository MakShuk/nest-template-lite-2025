export const ENV_VALUES = {
  NODE_ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  },
  DEFAULT_VALUES: {
    PORT: 3000,
    NODE_ENV: 'development',
    ENABLE_SWAGGER: true,
    ENABLE_REQUEST_LOGGING: true,
  },
} as const;
