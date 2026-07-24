const assert = require('node:assert/strict');
const test = require('node:test');

const { getConfigModuleOptions } = require('../dist/configs/config.module.js');
const { configValidationSchema } = require('../dist/configs/config.schema.js');
const { normalizeRequestIdentifier } = require('../dist/logger/logger.module.js');

test('configuration schema applies secure defaults', () => {
  const { error, value } = configValidationSchema.validate({});

  assert.ifError(error);
  assert.equal(value.ENABLE_SWAGGER, false);
  assert.equal(value.ENABLE_REQUEST_LOGGING, true);
  assert.equal(value.ALLOWED_ORIGINS, '');
  assert.equal(value.CORS_CREDENTIALS, false);
});

test('configuration schema reports invalid values', () => {
  const { error } = configValidationSchema.validate(
    {
      PORT: 'not-a-port',
      NODE_ENV: 'unknown',
    },
    {
      abortEarly: false,
    },
  );

  assert.ok(error);
  assert.match(error.message, /PORT/);
  assert.match(error.message, /NODE_ENV/);
});

test('credentialed CORS requires an explicit origin list', () => {
  for (const allowedOrigins of ['', '*', 'https://app.example.com,*']) {
    const { error } = configValidationSchema.validate({
      CORS_CREDENTIALS: true,
      ALLOWED_ORIGINS: allowedOrigins,
    });

    assert.ok(error);
  }

  const { error } = configValidationSchema.validate({
    CORS_CREDENTIALS: true,
    ALLOWED_ORIGINS: 'https://app.example.com, https://admin.example.com',
  });

  assert.ifError(error);
});

test('environment file paths never interpolate an unsupported NODE_ENV', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = '../../outside';

  try {
    const options = getConfigModuleOptions();
    assert.deepEqual(options.envFilePath, ['envs/.env.development.local', 'envs/.env.development']);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});

test('request identifiers accept a bounded safe character set', () => {
  assert.equal(normalizeRequestIdentifier(' request-123:_value '), 'request-123:_value');
  assert.equal(normalizeRequestIdentifier('unsafe\nvalue'), undefined);
  assert.equal(normalizeRequestIdentifier('a'.repeat(129)), undefined);
});
