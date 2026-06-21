import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _pool: pg.Pool | undefined;
let _db: DrizzleDb | undefined;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env["DATABASE_URL"]) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  }
  return _pool;
}

function getDb(): DrizzleDb {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Lazy proxy — the connection is created on the first query, not at import time.
// This prevents the process from crashing at startup if DATABASE_URL is missing.
export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_t, prop) {
    return (getPool() as unknown as Record<string, unknown>)[prop as string];
  },
});

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_t, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});

export * from "./schema";
