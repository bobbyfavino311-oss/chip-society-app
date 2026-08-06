---
name: EAS build — Hermes/JSC fix
description: How to fix hermesc "invalid statement encountered" on EAS iOS builds caused by react-native-web class declarations
---

## The rule
`jsEngine: "jsc"` must be at the **top level** of the `expo` object in `app.json` — NOT inside `expo.ios`. Expo prebuild ignores it when nested under `ios`.

## Correct placement
```json
{
  "expo": {
    "jsEngine": "jsc",
    "ios": { ... }
  }
}
```

## Why
EAS prebuild reads `expo.jsEngine` to set `hermes_enabled => false` in the Podfile, which sets `HERMES_ENABLED=NO` in Xcode build settings, preventing hermesc from running. When placed under `expo.ios.jsEngine`, prebuild ignores it and hermesc still compiles the bundle.

## Metro config must be clean
With `jsEngine: "jsc"`, hermesc never runs, so react-native-web class declarations are fine. Do NOT add any `resolver.resolveRequest` hacks — they cause Metro to crash with "Unknown error. See logs of the Bundle JavaScript build phase."

## What to avoid
- `expo.ios.jsEngine: "jsc"` — ignored by prebuild
- `resolver.resolveRequest` returning `{ type: "empty" }` — crashes Metro when combined with JSC mode
- Config plugins that crash `expo config --json` — EAS CLI validates config locally before submitting; if the plugin throws, the build never starts

**Why:**  Multiple EAS build credits were burned before finding the correct JSON path. hermesc is the cause of all "invalid statement encountered" errors on SDK 54 with react-native-web@0.21.

**How to apply:** Any time hermesc errors appear in EAS iOS builds.
