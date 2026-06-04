---
name: aiSocialEngine required exports
description: AISocialContext.tsx requires specific named exports from aiSocialEngine.ts.
---

## Required exports
AISocialContext.tsx imports:
- `formatTimeAgo(ms: number): string` — wraps internal timeAgo(); refreshes post labels every minute
- `seedAIPosts(count?: number): AIPost[]` — generates N initial posts (default 8)
- `generateAIPost(idSuffix?: string): AIPost` — idSuffix is optional (default = Date.now())

**Why:** AISocialContext has no visibility into the engine internals; if you rename or remove
any of these the context crashes with "Invalid hook call" at the error boundary level.

**How to apply:** Any refactor of aiSocialEngine.ts must keep all three exports with compatible signatures.
