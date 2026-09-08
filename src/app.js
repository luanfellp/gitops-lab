const express = require('express');
const packageJson = require('../package.json');

const app = express();

app.disable('x-powered-by');

app.use((request, response, next) => {
  const startedAt = Date.now();

  response.on('finish', () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });

  next();
});

app.get('/', (_request, response) => {
  response.json({
    application: 'SmartBR GitOps Lab',
    message: 'Aplicacao executada via GitOps',
    status: 'running',
  });
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/ready', (_request, response) => {
  response.json({ ready: true });
});

app.get('/version', (_request, response) => {
  response.json({
    version: process.env.BUILD_VERSION || packageJson.version,
    commit: process.env.COMMIT_SHA || 'local',
    environment: process.env.APP_ENV || 'local',
  });
});

module.exports = app;

