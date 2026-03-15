export const ENV_VALUES = {
  NODE_ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
  DEFAULT_VALUES: {
    APP_NAME: 'nest-cli-tg',
    PORT: 3000,
    NODE_ENV: 'development',
    ENABLE_SWAGGER: true,
    ENABLE_REQUEST_LOGGING: true,
    TELEGRAM_BOT_TOKEN: 'PASTE_TELEGRAM_BOT_TOKEN',
    TELEGRAM_DEFAULT_USER: '123456789',
  },
} as const;
