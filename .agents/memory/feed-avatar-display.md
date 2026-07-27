---
name: Feed avatar display — own-post and server-hosted photo
description: Root causes and fixes for custom photos not showing in the live feed for own posts and other users' posts.
---

## Rule
When showing a custom photo in `LivePostCard`, the `photoUrl` for **own posts** must fall back to `post.authorAvatarUrl` (from the feed API's live DB lookup) — not just `profile.avatarUri` / `profile.serverAvatarUrl` from local AsyncStorage.

**Why:** A photo uploaded server-side (e.g. via admin script / Python) sets `serverAvatarUrl` in the DB's `profileJson`, but the local AsyncStorage profile never learns about it — so `profile.profileImageType` stays `'symbol'` and the old code returned `null` for own posts.

**How to apply:**
```js
const photoUrl = isOwn
  ? (profile.profileImageType === 'custom'
      ? (profile.avatarUri ?? profile.serverAvatarUrl ?? post.authorAvatarUrl ?? null)
      : (post.authorAvatarUrl ?? profile.serverAvatarUrl ?? null))
  : (post.authorAvatarUrl ?? null);
```

## Rule
`POST /social/posts` (createPost) response **must include `authorAvatarUrl`** — otherwise the optimistic insert shows no photo, and even after the 1.5 s refetch the post ID is the same so the FlatList key preserves the missing-URL state if avatarImgFailed was already set.

**Fix:** Look up `author.profileJson.serverAvatarUrl` in the createPost handler and include `authorAvatarUrl` in the returned post object.

## Rule
Use `expo-image` (`Image as ExpoImage`) instead of React Native's built-in `Image` for avatar URLs loaded from Railway HTTPS endpoints. RN's Image can silently fail (fire `onError`) for certain CDN responses on iOS/Expo Go; expo-image with `cachePolicy="memory-disk"` handles them reliably.

## Debugging
- The 2-second timeout fallback (`setAvatarImgFailed`) was a red herring — it only triggered when `isOwn && profileImageType === 'custom' && avatarUri`, which is never true for a viewer watching someone else's posts.
- The real tell: `failed: false` in debug logs means the image IS loading; `failed: true` means `onError` fired. If no debug log appears at all, `post.authorAvatarUrl` is null/undefined reaching the component.
- PIL-resized images (400×400, quality 80) are ~19 KB and load fine on iOS. The original 2 MB upload was replaced via Python + PIL before any app-side upload path existed.
