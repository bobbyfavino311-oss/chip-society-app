---
name: Live social feed architecture
description: Real-time social feed backed by Railway Postgres — tables, API routes, mobile context, and FlatList discriminated union pattern.
---

## DB Tables (lib/db/src/schema/index.ts)
- `feedPostsTable` — posts (id, authorId, content, tag, pot, handRank, likeCount, commentCount, createdAt)
- `postLikesTable` — PK(postId, playerId), composite unique, CASCADE on post delete
- `postCommentsTable` — (id, postId, authorId, text, createdAt), CASCADE on post delete

## API Routes (artifacts/api-server/src/routes/social.ts)
- `GET /social/feed?tab=all|trending|me&cursor=` — paginated 30 posts, likedByMe batch-checked via inArray
- `POST /social/posts` — creates post, emits `new_feed_post` via emitToAll
- `POST /social/posts/:id/like` — toggles like, updates likeCount atomically via GREATEST(0, count-1)
- `GET /social/posts/:id/comments` — latest 50 comments
- `POST /social/posts/:id/comments` — creates comment, increments commentCount
- `DELETE /social/posts/:id` — own posts only, cascades to likes+comments

## Mobile (artifacts/neon-river)
- `lib/socialApi.ts` — FeedPost, FeedComment interfaces + getFeed/createPost/toggleLike/getComments/addComment/deleteFeedPost
- `context/LiveFeedContext.tsx` — 30s polling, optimistic like toggle (flip immediately, reconcile on API response), publishPost prepends to state
- `LiveFeedProvider` wraps inside `<AISocialProvider>` in `_layout.tsx`

## Feed FlatList discriminated union pattern
```typescript
type FeedItem = { _k: 'live'; post: FeedPost } | { _k: 'mock'; post: SocialPost };
// Live real posts first; mock AI filler shown only when livePosts.length < 8
keyExtractor={item => item._k === 'live' ? `live_${item.post.id}` : `mock_${item.post.id}`}
renderItem={({ item }) => item._k === 'live' ? <LivePostCard> : <PostCard>}
```

**Why:** Discriminated union lets FlatList handle mixed live + mock data safely; keyExtractor prefix prevents key collisions between real and mock posts.

## LivePostCard
Defined directly in feed.tsx before PostCard. Uses `useLiveFeed()` for like/comment/delete; `useSocial()` for follow/mute/block. Inline comment expansion loads from API on first open. Uses existing `cd` StyleSheet keys — no new stylesheet needed.

## RAILWAY_API_TOKEN
Not available as a Replit env var with the standard name. Was accessed directly from scratchpad during deployment. User should add it as a Replit Secret named `RAILWAY_API_TOKEN` for future sessions.
