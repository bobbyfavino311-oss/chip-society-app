---
name: Railway DB vs Replit DB
description: Replit DATABASE_URL is a local Replit Postgres; Railway api-server uses a different Railway-internal Postgres. Migrations must target Railway's DB separately.
---

## The Two-Database Problem

`DATABASE_URL` in the Replit workspace environment points to a **Replit-managed local Postgres** — not the Railway production database. This means:

- `pnpm --filter @workspace/db run push` (or any drizzle-kit command) in the Replit shell migrates the **Replit Postgres only**
- The Railway api-server connects to **Railway's internal Postgres** (different instance entirely)
- The Replit DB is essentially empty (no real users); the Railway DB has all production data

**How to identify the problem:** If Railway logs show `column "some_column" does not exist` after a schema change, the Railway DB wasn't migrated.

## How to migrate the Railway production DB

Use the Railway GraphQL API to fetch `DATABASE_PUBLIC_URL` from the Postgres service variables, then run SQL directly:

```python
RAILWAY_TOKEN = ...
PROJECT_ID = "aabdb2cd-24ac-45db-9f89-ddceb5fbc7e9"
PG_SERVICE_ID = "fd4d8b71-abf6-4c74-ac05-30c17eb2ff77"
ENV_ID = "61b9c938-0a05-4394-a58f-e20f09912f09"

VARS = railway_graphql("{ variables(projectId, serviceId, environmentId) }")
pub_url = VARS["DATABASE_PUBLIC_URL"]
subprocess.run(["psql", pub_url, "-c", "ALTER TABLE players ADD COLUMN IF NOT EXISTS new_col text;"])
```

Do NOT use `drizzle-kit push` against the Railway DB — it asks interactive rename questions and can't be run non-interactively safely.

**Why:** `drizzle-kit push` uses the env's DATABASE_URL (Replit local). Railway's internal DB URL is only accessible via Railway's service networking or the Railway-provided public URL (fetched via GraphQL API).

## Missing dist files = Railway COPY failure

The Dockerfile COPYs multiple `.mjs` files from `artifacts/api-server/dist/`. The `.gitignore` has `dist`, so only files explicitly force-added are tracked. When adding new build outputs, always run:

```bash
git add -f artifacts/api-server/dist/
git commit -m "..."
```

Missing dist files cause: `failed to compute cache key: "/artifacts/api-server/dist/thread-stream-worker.mjs": not found` → every Railway deployment fails.

Current tracked dist files (as of fix):
- index.mjs + index.mjs.map
- pino-worker.mjs + .map
- pino-file.mjs + .map
- pino-pretty.mjs + .map
- thread-stream-worker.mjs + .map

**Why:** Railway builds the Dockerfile from the git checkout. Files not in git aren't in the build context.
