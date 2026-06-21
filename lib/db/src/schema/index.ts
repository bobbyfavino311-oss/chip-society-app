import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const playersTable = pgTable('players', {
  playerId:      text('player_id').primaryKey(),
  username:      text('username').notNull().unique(),
  usernameLower: text('username_lower').notNull().unique(),
  email:         text('email').notNull().default(''),
  pinHash:       text('pin_hash').notNull(),
  profileJson:   jsonb('profile_json').notNull().$type<Record<string, unknown>>(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Player    = typeof playersTable.$inferSelect;
export type NewPlayer = typeof playersTable.$inferInsert;
