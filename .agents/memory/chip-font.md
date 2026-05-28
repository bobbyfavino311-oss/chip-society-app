---
name: Chip amount font
description: Font rule for chip amount display — user-confirmed preference.
---

## Rule
Use **Inter_700Bold** for all chip amounts and numbers. Never use Orbitron for numeric values.

## Why
User explicitly rejected Orbitron as "slanted sci-fi" when it was used for chip amounts. Inter_700Bold gives clean, bold, arcade-style readability.

## How to apply
- `ChipAmount.tsx` uses Inter_700Bold
- Any new component showing chip counts, balances, prizes, or blinds should use Inter_700Bold
- Orbitron is only for non-numeric labels, titles, badges, and UI headings
