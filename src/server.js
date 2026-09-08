const app = require('./app');

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'server_started',
    port,
  }));
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'shutdown_started',
    signal,
  }));

  server.close((error) => {
    if (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'shutdown_failed',
        message: error.message,
      }));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'shutdown_complete',
    }));
  });

  setTimeout(() => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'shutdown_timeout',
    }));
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

