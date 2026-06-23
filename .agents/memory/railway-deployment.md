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
- `UserContext.tsx` native hardcoded: `https://api-server-production-bbc2.up.railway.app/api` (single source of truth)
- `MultiplayerContext.tsx` socket URL fallback: `https://api-server-production-bbc2.up.railway.app`
- Admin panel `VITE_API_BASE` = `https://api-server-production-bbc2.up.railway.app/api` (set in shared env)
- Admin routes `/api/admin/*` use `x-admin-key` header (NOT `x-admin-secret`) checked against `ADMIN_SECRET` env var on Railway
- `ADMIN_SECRET` must be set on Railway via GraphQL variableUpsert — it was NOT present by default

## Deployment method (CORRECT — verified working)

### Full deploy procedure:
1. Build: `pnpm --filter @workspace/api-server run build`
2. Push `dist/index.mjs` to GitHub repo root `dist/index.mjs` (NOT `artifacts/api-server/dist/`) via Git Data API
3. Bump Railway `BUILD_ID` env var (any new timestamp value) — this is the ONLY way to force a full rebuild from GitHub
4. Trigger: `serviceInstanceDeployV2` GraphQL mutation — must see BUILDING phase in status poll (not just INITIALIZING→SUCCESS in <5s)
5. If schema changed: run `pnpm --filter @workspace/db run push` with public Railway Postgres URL

### Step 3 detail — force cache bust:
```bash
TIMESTAMP=$(date +%s)
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -d '{"query":"mutation { variableUpsert(input: { projectId: \"...\", environmentId: \"...\", serviceId: \"...\", name: \"BUILD_ID\", value: \"'$TIMESTAMP'\" }) }"}'
```
**Why:** Railway caches the Docker image and `serviceInstanceDeployV2` alone just restarts the cached container. Adding/updating a Railway env var forces a full nixpacks rebuild pulling the latest GitHub commit.

### GitHub repo structure:
- Root `dist/index.mjs` — the bundled server (what Railway runs)
- Root `package.json` — `{"scripts":{"start":"node --enable-source-maps dist/index.mjs"}}` v1.1.0
- Root `railway.toml` — nixpacks config
- `artifacts/api-server/dist/` — DO NOT push here, Railway ignores this path

### GitHub token (classic PAT, `repo` scope):
Use `GITHUB_PERSONAL_ACCESS_TOKEN` from Replit Secrets. Must be a **classic** PAT with `repo` scope — fine-grained PATs don't have repo creation or push permissions on a fresh account.

## Admin API header
Admin routes check `req.headers['x-admin-key']` (NOT `x-admin-secret`).

## Known blockers / gotchas
- **Railway CLI v5**: `whoami` and `railway up` both return "Unauthorized" with API tokens. Use GraphQL API + GitHub push instead.
- **serviceInstanceDeployV2 alone**: Just restarts the cached image — does NOT pull new GitHub code. Must first update `BUILD_ID` env var.
- **serviceInstanceDeploy (non-V2)**: Same issue — restarts cached image.
- **githubRepoDeploy**: Creates a NEW service, not updating the existing one. Do not use for updates.
- **Fine-grained GitHub PAT**: Cannot create repos or push on fresh account — use classic PAT with `repo` scope.
- **Replit git push**: Blocked by Replit sandbox. Use GitHub Contents API (Git Data API blobs) instead.
- **Railway GitHub App webhook**: Not installed on `bobbyfavino311-oss` account — GitHub pushes alone do NOT trigger Railway auto-deploys.

## To run DB migrations against Railway
```
DATABASE_URL="postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:50049/railway" pnpm --filter @workspace/db run push
```
**Why:** The internal URL only works within Railway's private network. Use the public proxy URL from outside.
