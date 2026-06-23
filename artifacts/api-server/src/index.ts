import { createServer } from 'http';
import app from './app.js';
import { setupSocketIO } from './sockets/index.js';
import { logger } from './lib/logger.js';
import { pool } from '@workspace/db';

const rawPort = process.env['PORT'];

if (!rawPort) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

logger.info({ domains: process.env['REPLIT_DOMAINS'] ?? 'unset' }, 'Production domains');

// ── Startup migrations ──────────────────────────────────────────────────────
// Run lightweight "CREATE TABLE IF NOT EXISTS" migrations so the DB schema
// stays in sync when a new version is deployed to Railway without a separate
// migration step.

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS chip_transactions (
        tx_id            TEXT PRIMARY KEY,
        player_id        TEXT NOT NULL REFERENCES players(player_id),
        type             TEXT NOT NULL,
        amount           INTEGER NOT NULL,
        balance_after    INTEGER NOT NULL DEFAULT 0,
        note             TEXT NOT NULL DEFAULT '',
        admin_id         TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_reports (
        report_id    TEXT PRIMARY KEY,
        reported_id  TEXT NOT NULL REFERENCES players(player_id),
        reporter_id  TEXT,
        reason       TEXT NOT NULL,
        details      TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'open',
        resolution   TEXT,
        resolved_at  TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_notifications (
        notification_id  TEXT PRIMARY KEY,
        player_id        TEXT NOT NULL REFERENCES players(player_id),
        type             TEXT NOT NULL DEFAULT 'bonus',
        title            TEXT NOT NULL,
        amount           INTEGER NOT NULL DEFAULT 0,
        message          TEXT,
        reason           TEXT NOT NULL DEFAULT '',
        read             BOOLEAN NOT NULL DEFAULT FALSE,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    logger.info('Startup migrations complete');
  } catch (err) {
    logger.error({ err }, 'Startup migration failed — continuing anyway');
  } finally {
    client.release();
  }
}

const httpServer = createServer(app);
setupSocketIO(httpServer);

httpServer.on('error', (err) => {
  logger.error({ err }, 'HTTP server error');
  process.exit(1);
});

httpServer.listen(port, async () => {
  logger.info({ port }, 'Server listening');
  await runMigrations();
});
