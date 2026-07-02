---
name: Chip Store / Buy Chips unification
description: Single source of truth for chip and scratch-ticket purchases in Chip Society; both entry points share one screen and one RevenueCat-backed catalog.
---

Both the "Chip Store" tab and Profile's "BUY CHIPS" button now route to the same screen: `app/(tabs)/store.tsx`. The old separate `app/chip-shop.tsx` screen was deleted (and its `Stack.Screen` registration removed from `app/_layout.tsx`) because it duplicated the catalog with hardcoded fake data and `Alert.alert` placeholders instead of real purchases.

**Why:** Two independent product catalogs (one real via RevenueCat, one fake/hardcoded) drifted out of sync and showed different prices/packages depending on entry point, and neither scratch tickets nor chips actually charged the user.

**How to apply:** Both chip packages and scratch ticket bundles are driven entirely by RevenueCat offerings (`useSubscription().offerings.current.availablePackages`), filtered through `CHIP_BUNDLE_MAP` / `TICKET_BUNDLE_MAP` in `lib/revenuecat.tsx` (product identifier → app-side metadata: amount, label, color, bonus badge). Never hardcode a package list or price in UI code — if a new bundle is needed, add it to `CHIP_BUNDLE_MAP`/`TICKET_BUNDLE_MAP` AND to `scripts/src/seedRevenueCat.ts`'s `CHIP_BUNDLES`/`TICKET_BUNDLES` arrays (which create the real RevenueCat products/prices/packages), then rerun the seed script. If any other screen needs to link to chip/ticket purchases, point it at `/(tabs)/store`, not a new bespoke screen.
