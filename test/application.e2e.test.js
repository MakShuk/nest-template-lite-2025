const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.ENABLE_SWAGGER = 'false';
process.env.ENABLE_REQUEST_LOGGING = 'false';
delete process.env.ALLOWED_ORIGINS;
delete process.env.CORS_CREDENTIALS;

const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module.js');
const { AppConfigService } = require('../dist/configs/config.service.js');
const { setupApplication } = require('../dist/setup/application.setup.js');

test('HTTP baseline exposes health, security headers, and normalized error responses', async context => {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = testingModule.createNestApplication();

  setupApplication(app, app.get(AppConfigService));
  await app.init();
  context.after(() => app.close());

  const healthResponse = await request(app.getHttpServer())
    .get('/health')
    .set('Origin', 'https://example.invalid')
    .set('X-Correlation-Id', 'template-test');

  assert.equal(healthResponse.status, 200);
  assert.deepEqual(healthResponse.body, { status: 'ok' });
  assert.equal(healthResponse.headers['x-correlation-id'], 'template-test');
  assert.equal(healthResponse.headers['x-content-type-options'], 'nosniff');
  assert.equal(healthResponse.headers['access-control-allow-origin'], undefined);

  const invalidIdentifierResponse = await request(app.getHttpServer())
    .get('/health')
    .set('X-Correlation-Id', 'unsafe value');

  assert.match(
    invalidIdentifierResponse.headers['x-correlation-id'],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

  const notFoundResponse = await request(app.getHttpServer()).get('/missing');

  assert.equal(notFoundResponse.status, 404);
  assert.equal(notFoundResponse.body.statusCode, 404);
  assert.equal(notFoundResponse.body.error, 'Not Found');
  assert.equal(notFoundResponse.body.path, '/missing');
  assert.equal(typeof notFoundResponse.body.correlationId, 'string');
});
