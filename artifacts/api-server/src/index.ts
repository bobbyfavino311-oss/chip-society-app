import { createServer } from 'http';
import app from './app.js';
import { setupSocketIO } from './sockets/index.js';
import { logger } from './lib/logger.js';

const rawPort = process.env['PORT'];

if (!rawPort) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

logger.info({ domains: process.env['REPLIT_DOMAINS'] ?? 'unset' }, 'Production domains');

const httpServer = createServer(app);
setupSocketIO(httpServer);

httpServer.on('error', (err) => {
  logger.error({ err }, 'HTTP server error');
  process.exit(1);
});

httpServer.listen(port, () => {
  logger.info({ port }, 'Server listening');
});
