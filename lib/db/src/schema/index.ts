import { pgTable, text, jsonb, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const playersTable = pgTable('players', {
  playerId:             text('player_id').primaryKey(),
  username:             text('username').notNull().unique(),
  usernameLower:        text('username_lower').notNull().unique(),
  email:                text('email').notNull().default(''),
  pinHash:              text('pin_hash').notNull(),
  profileJson:          jsonb('profile_json').notNull().$type<Record<string, unknown>>(),
  status:               text('status').notNull().default('active'),
  banReason:            text('ban_reason'),
  suspensionExpiresAt:  timestamp('suspension_expires_at', { withTimezone: true }),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const chipTransactionsTable = pgTable('chip_transactions', {
  txId:        text('tx_id').primaryKey(),
  playerId:    text('player_id').notNull().references(() => playersTable.playerId),
  type:        text('type').notNull(),
  amount:      integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  note:        text('note').notNull().default(''),
  adminId:     text('admin_id'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const playerReportsTable = pgTable('player_reports', {
  reportId:      text('report_id').primaryKey(),
  reportedId:    text('reported_id').notNull().references(() => playersTable.playerId),
  reporterId:    text('reporter_id'),
  reason:        text('reason').notNull(),
  details:       text('details').notNull().default(''),
  status:        text('status').notNull().default('open'),
  resolution:    text('resolution'),
  resolvedAt:    timestamp('resolved_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const playerNotificationsTable = pgTable('player_notifications', {
  notificationId: text('notification_id').primaryKey(),
  playerId:       text('player_id').notNull().references(() => playersTable.playerId),
  type:           text('type').notNull().default('bonus'),
  title:          text('title').notNull(),
  amount:         integer('amount').notNull().default(0),
  message:        text('message'),
  reason:         text('reason').notNull().default(''),
  read:           boolean('read').notNull().default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const moderationActionsTable = pgTable('moderation_actions', {
  id:            text('id').primaryKey(),
  playerId:      text('player_id').notNull().references(() => playersTable.playerId),
  adminId:       text('admin_id').notNull(),
  type:          text('type').notNull(), // 'warning' | 'suspension' | 'ban' | 'unban'
  reason:        text('reason').notNull(),
  message:       text('message'),
  durationHours: integer('duration_hours'),
  expiresAt:     timestamp('expires_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Player                = typeof playersTable.$inferSelect;
export type NewPlayer             = typeof playersTable.$inferInsert;
export type ChipTransaction       = typeof chipTransactionsTable.$inferSelect;
export type PlayerReport          = typeof playerReportsTable.$inferSelect;
export type PlayerNotification    = typeof playerNotificationsTable.$inferSelect;
export type ModerationAction      = typeof moderationActionsTable.$inferSelect;
