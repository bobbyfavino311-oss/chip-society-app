---
name: Play tab conventions
description: What belongs in the Play tab vs Home tab, and how locked modes are displayed.
---

## Tournament discovery
Tournaments are surfaced ONLY on the Home screen (Live Tournaments carousel). The Play tab has no tournament button or link. Do not add tournament navigation to the Play tab.

## VariantCard props
`VariantCard` accepts only `{ variant, onAIPractice, onRules? }`. There is no `onTournaments` or `onQuickMatch` prop.

## Locked modes (Quick Match, Ranked)
These render as non-pressable buttons with:
- `styles.actionBtnLocked` (dim border + transparent bg)
- `styles.actionBtnLabelLocked` (gray label)
- `styles.soonChip` / `styles.soonText` ("SOON" badge)
- Lock icon (`lock-closed-outline`)

**Why:** User wants multiplayer coming soon without dead buttons that navigate nowhere. Play tab is for AI Practice for now; tournament discovery from Home keeps that section prominent.
