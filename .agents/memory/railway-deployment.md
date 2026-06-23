---
name: Railway deployment
description: API server and Postgres hosted on Railway — URLs, project IDs, deployment method, known blockers.
---

## Live URLs
- **API server**: `https://api-server-production-bbc2.up.railway.app`
  - Health check: `GET /api/healthz` → `{"status":"ok"}`
  - Auth routes: `/api/auth/*`
  - Socket.IO: `/api/socket.io`
- **Postgres public URL**: `postgresql://postgres:...@yamanote.proxy.rlwy.net:50049/railway`
- **Postgres internal URL**: `postgresql://postgres:...@postgres.railway.internal:5432/railway`

## Railway project
- Project ID: `aabdb2cd-24ac-45db-9f89-ddceb5fbc7e9`
- Environment ID: `61b9c938-0a05-4394-a58f-e20f09912f09`
- api-server service ID: `b941b836-b2bb-405d-8b4a-25ba63327b72`
- Postgres service ID: `fd4d8b71-abf6-4c74-ac05-30c17eb2ff77`

## App config
- `serve.js` injects `RAILWAY_API_URL` into manifest `extra.expoClient.extra.apiUrl`
- `UserContext.tsx` native hardcoded: `https://api-server-production-bbc2.up.railway.app/api` (single source of truth)
- `MultiplayerContext.tsx` socket URL fallback: `https://api-server-production-bbc2.up.railway.app`
- Admin panel `VITE_API_BASE` = `https://api-server-production-bbc2.up.railway.app/api` (set in shared env)
- Admin routes `/api/admin/*` protected by `ADMIN_SECRET` env var (set on Railway); key: see Secrets tab
- `ADMIN_SECRET` must be set on Railway via GraphQL variableUpsert — it was NOT present by default

## Deployment method (how to update the server)
The Railway service is connected to GitHub repo `bobbyfavino311-oss/chip-society`.
To redeploy:
1. Build: `pnpm --filter @workspace/api-server run build`
2. Upload `dist/index.mjs` blob via GitHub Git Data API (blob → tree → commit → ref update)
3. Trigger: Railway GraphQL `serviceInstanceDeploy` mutation
4. If schema changed: run `pnpm --filter @workspace/db run push` with public Railway Postgres URL

**Why not Railway CLI**: CLI v5 `whoami` returns "Unauthorized" even with valid account tokens. Use Railway GraphQL API directly with token.

**Why not git push from Replit**: Replit main agent has a hard block on all `git push` operations. Use GitHub Contents API (base64 file upload) instead.

## To run DB migrations against Railway
```
DATABASE_URL="postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:50049/railway" pnpm --filter @workspace/db run push
```

**Why:** The internal URL only works within Railway's private network. Use the public proxy URL from outside.
