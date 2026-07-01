import { pgTable, text, jsonb, timestamp, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

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

// ── Social tables ──────────────────────────────────────────────────────────────

export const followsTable = pgTable('follows', {
  followerId:  text('follower_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]);

export const conversationsTable = pgTable('conversations', {
  id:           text('id').primaryKey(),
  p1Id:         text('p1_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  p2Id:         text('p2_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  lastPreview:  text('last_preview').notNull().default(''),
  lastAt:       timestamp('last_at', { withTimezone: true }).defaultNow(),
  unread1:      integer('unread1').notNull().default(0),
  unread2:      integer('unread2').notNull().default(0),
});

export const directMessagesTable = pgTable('direct_messages', {
  id:             text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  senderId:       text('sender_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  text:           text('text').notNull(),
  readAt:         timestamp('read_at', { withTimezone: true }),
  isReported:     boolean('is_reported').notNull().default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const blocksTable = pgTable('blocks', {
  blockerId:  text('blocker_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  blockedId:  text('blocked_id').notNull().references(() => playersTable.playerId, { onDelete: 'cascade' }),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);

// ── Feed posts ────────────────────────────────────────────────────────────────

export const feedPostsTable = pgTable('feed_posts', {
  id:           text('id').primaryKey(),
  authorId:     text('author_id').notNull(),
  content:      text('content').notNull(),
  tag:          text('tag').notNull().default('WIN'),
  pot:          text('pot'),
  handRank:     text('hand_rank'),
  likeCount:         integer('like_count').notNull().default(0),
  commentCount:      integer('comment_count').notNull().default(0),
  authorUsername:    text('author_username'),
  authorAvatarIndex: integer('author_avatar_index'),
  authorRank:        text('author_rank'),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const postLikesTable = pgTable('post_likes', {
  postId:    text('post_id').notNull().references(() => feedPostsTable.id, { onDelete: 'cascade' }),
  playerId:  text('player_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [primaryKey({ columns: [t.postId, t.playerId] })]);

export const postCommentsTable = pgTable('post_comments', {
  id:        text('id').primaryKey(),
  postId:    text('post_id').notNull().references(() => feedPostsTable.id, { onDelete: 'cascade' }),
  authorId:  text('author_id').notNull(),
  text:      text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Bug reports ───────────────────────────────────────────────────────────────

export const bugReportsTable = pgTable('bug_reports', {
  id:          text('id').primaryKey(),
  playerId:    text('player_id'),
  username:    text('username').notNull().default('Anonymous'),
  category:    text('category').notNull().default('other'),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  deviceInfo:  jsonb('device_info').$type<Record<string, unknown>>().notNull().default({}),
  status:      text('status').notNull().default('open'),
  priority:    text('priority').notNull().default('medium'),
  adminNotes:  text('admin_notes'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Referrals ─────────────────────────────────────────────────────────────────

export const referralsTable = pgTable('referrals', {
  referralId:    text('referral_id').primaryKey(),
  referrerId:    text('referrer_id').notNull().references(() => playersTable.playerId),
  refereeId:     text('referee_id').notNull().unique().references(() => playersTable.playerId),
  referrerBonus: integer('referrer_bonus').notNull(),
  refereeBonus:  integer('referee_bonus').notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Announcements ─────────────────────────────────────────────────────────────

export const announcementsTable = pgTable('announcements', {
  id:        text('id').primaryKey(),
  title:     text('title').notNull(),
  body:      text('body').notNull(),
  postedBy:  text('posted_by').notNull().default('Dev Team'),
  pinned:    boolean('pinned').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Types ──────────────────────────────────────────────────────────────────────

export type Player                = typeof playersTable.$inferSelect;
export type NewPlayer             = typeof playersTable.$inferInsert;
export type ChipTransaction       = typeof chipTransactionsTable.$inferSelect;
export type PlayerReport          = typeof playerReportsTable.$inferSelect;
export type PlayerNotification    = typeof playerNotificationsTable.$inferSelect;
export type ModerationAction      = typeof moderationActionsTable.$inferSelect;
export type Follow                = typeof followsTable.$inferSelect;
export type Conversation          = typeof conversationsTable.$inferSelect;
export type DirectMessage         = typeof directMessagesTable.$inferSelect;
export type Block                 = typeof blocksTable.$inferSelect;
export type BugReport             = typeof bugReportsTable.$inferSelect;
export type FeedPost              = typeof feedPostsTable.$inferSelect;
export type NewFeedPost           = typeof feedPostsTable.$inferInsert;
export type PostLike              = typeof postLikesTable.$inferSelect;
export type PostComment           = typeof postCommentsTable.$inferSelect;
export type Announcement          = typeof announcementsTable.$inferSelect;
