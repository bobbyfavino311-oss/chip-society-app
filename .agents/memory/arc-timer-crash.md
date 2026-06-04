---
name: Game screen crash — ArcTimer module-level createAnimatedComponent
description: Removing unused PlayerSeat import from practice.tsx fixed "Invalid hook call" crash on game screen open. Root cause traced to ArcTimer.tsx.
---

## The Rule

Never import `PlayerSeat` (or `ArcTimer`) from any game screen. If seat-level arc timer UI is needed, use `DotTimer` instead — it has no module-level React Native SVG calls.

## Why

`PlayerSeat.tsx` imports `ArcTimer.tsx`. `ArcTimer.tsx` has this at module level (outside any component):

```ts
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
```

`Circle` is from `react-native-svg`. On React Native Web 0.21.x + React 19.1.0 + React Compiler enabled (which is the case in this project via Expo SDK 54), calling `Animated.createAnimatedComponent` with an SVG component at module initialization time triggers "Invalid hook call" before the game screen's React fiber is established. The error is attributed to the first screen component in the game Stack (`PracticeScreen`).

## How to Apply

- `practice.tsx` should import `DotTimer` and `NeonAvatar` for per-seat UI — never `PlayerSeat` or `ArcTimer` directly.
- `tournament.tsx` is already clean (no PlayerSeat/ArcTimer imports).
- If `ArcTimer` is ever needed again, it must be lazily imported inside a component body or the module-level `createAnimatedComponent` call must be moved inside a factory function.
- The crash was silent and hard to trace because the error log says `PracticeScreen` not `ArcTimer`.
