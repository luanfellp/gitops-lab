const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /health retorna o estado da aplicacao', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('GET /version retorna versao, commit e ambiente', async () => {
  process.env.BUILD_VERSION = '1.2.3';
  process.env.COMMIT_SHA = 'abc1234';
  process.env.APP_ENV = 'argocd-test';

  const response = await request(app).get('/version');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    version: '1.2.3',
    commit: 'abc1234',
    environment: 'argocd-test',
  });
});

