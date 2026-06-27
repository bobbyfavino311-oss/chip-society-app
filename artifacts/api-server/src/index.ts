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
    await client.query(`
      CREATE TABLE IF NOT EXISTS moderation_actions (
        id            TEXT PRIMARY KEY,
        player_id     TEXT NOT NULL REFERENCES players(player_id),
        admin_id      TEXT NOT NULL DEFAULT 'system',
        type          TEXT NOT NULL,
        reason        TEXT NOT NULL DEFAULT '',
        message       TEXT,
        duration_hours INTEGER,
        expires_at    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE players
        ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS ban_reason TEXT;
    `);
    // Backfill columns added after initial table creation
    await client.query(`
      ALTER TABLE player_notifications
        ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT '';
    `);
    await client.query(`
      ALTER TABLE player_notifications
        ADD COLUMN IF NOT EXISTS message TEXT;
    `);
    await client.query(`
      ALTER TABLE player_notifications
        ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id   TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        following_id  TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id            TEXT PRIMARY KEY,
        p1_id         TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        p2_id         TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        last_preview  TEXT NOT NULL DEFAULT '',
        last_at       TIMESTAMPTZ DEFAULT NOW(),
        unread1       INTEGER NOT NULL DEFAULT 0,
        unread2       INTEGER NOT NULL DEFAULT 0
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id              TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id       TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        text            TEXT NOT NULL,
        read_at         TIMESTAMPTZ,
        is_reported     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS dm_conversation_idx ON direct_messages(conversation_id, created_at);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        blocker_id  TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        blocked_id  TEXT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (blocker_id, blocked_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id          TEXT PRIMARY KEY,
        player_id   TEXT,
        username    TEXT NOT NULL DEFAULT 'Anonymous',
        category    TEXT NOT NULL DEFAULT 'other',
        title       TEXT NOT NULL,
        description TEXT NOT NULL,
        device_info JSONB NOT NULL DEFAULT '{}',
        status      TEXT NOT NULL DEFAULT 'open',
        priority    TEXT NOT NULL DEFAULT 'medium',
        admin_notes TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // ── Social feed tables ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS feed_posts (
        id            TEXT PRIMARY KEY,
        author_id     TEXT NOT NULL,
        content       TEXT NOT NULL,
        tag           TEXT NOT NULL DEFAULT 'WIN',
        pot           TEXT,
        hand_rank     TEXT,
        like_count    INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS feed_posts_created_idx ON feed_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS feed_posts_author_idx  ON feed_posts(author_id, created_at DESC);
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id    TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        player_id  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (post_id, player_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id         TEXT PRIMARY KEY,
        post_id    TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        author_id  TEXT NOT NULL,
        text       TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments(post_id, created_at);
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
