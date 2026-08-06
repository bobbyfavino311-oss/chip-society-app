---
name: OTA updates from Replit
description: How to push EAS OTA updates directly from Replit without the user's Mac.
---

# OTA Updates from Replit

## The rule
`eas-cli` is already installed in the Replit environment (`eas-cli/21.6.0`). OTA updates can be pushed directly from here using `EXPO_TOKEN` for auth — no Mac needed.

**Why:** The user's Mac often has stale code; pushing OTA from Mac = deploying old code. Replit always has the latest code, so pushing from here is safer and faster.

**How to apply:**
1. Ensure `babel-preset-expo` is installed as a devDep in `artifacts/neon-river` (required for `eas update` to bundle — it's missing from the default pnpm install).
2. Run: `cd artifacts/neon-river && EXPO_TOKEN=<token> npx eas-cli update --channel production --message "..." --non-interactive`
3. The EXPO_TOKEN should be stored in Replit Secrets as `EXPO_TOKEN` (account: bfexpo / bobbyfavino311@gmail.com).

## OTA apply sequence (on device)
OTA updates require two launches to apply:
1. Force-close app → open (downloads update in background)
2. Force-close → open again (applies the update)
