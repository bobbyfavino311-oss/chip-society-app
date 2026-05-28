---
name: AI Social Engine architecture
description: How the AI social posting system is structured and wired together.
---

The AI social post system is fully in-memory — no API calls, no network.

## Key files
- `lib/aiSocialEngine.ts` — personalities, post templates, `generateAIPost()`, `seedAIPosts()`, `formatTimeAgo()`
- `context/AISocialContext.tsx` — React context; seeds 8 posts on mount, adds one every 10 min via setInterval, refreshes timeAgo labels every minute; exports `useAISocial()`
- Provider is registered in `app/_layout.tsx` inside `<SocialProvider>`

## AIPost interface (defined in aiSocialEngine.ts)
```ts
{ id, type: AIPostType, tag, tagColor, personality: AIPersonality, content, pot?, handRank?,
  likes, comments, reactions, timestamp, timeAgo }
```

## Integration points
- Home screen (`app/(tabs)/index.tsx`): `useAISocial().posts.slice(0,5)` mapped to `TrendPost[]` for the Trending Now horizontal scroll
- Feed screen (`app/(tabs)/feed.tsx`): `<AIPostsStrip>` is `ListHeaderComponent` of the trending FlatList; shows the newest 6 AI posts as horizontal mini-cards

**Why:** Static post data felt dead. AI posts create the illusion of a live community without any backend.

**How to apply:** When importing AIPost type, import from `lib/aiSocialEngine.ts` not from `AISocialContext.tsx` (the context does not re-export it).
