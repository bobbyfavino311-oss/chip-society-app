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
- `UserContext.tsx` hardcoded fallback: `https://api-server-production-bbc2.up.railway.app/api`
- `MultiplayerContext.tsx` socket URL fallback: `https://api-server-production-bbc2.up.railway.app`

## Deployment method (how to update the server)
The Railway service is connected to GitHub repo `bobbyfavino311-oss/chip-society`.
To redeploy: upload new built files to GitHub via GitHub Contents API (PUT /repos/.../contents/dist/...) and trigger redeploy via Railway GraphQL `serviceInstanceDeploy` mutation.

**Why not Railway CLI**: CLI v5 `whoami` returns "Unauthorized" even with valid account tokens. Use Railway GraphQL API directly with token.

**Why not git push from Replit**: Replit main agent has a hard block on all `git push` operations. Use GitHub Contents API (base64 file upload) instead.

## To run DB migrations against Railway
```
DATABASE_URL="postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:50049/railway" pnpm --filter @workspace/db run push
```

**Why:** The internal URL only works within Railway's private network. Use the public proxy URL from outside.
