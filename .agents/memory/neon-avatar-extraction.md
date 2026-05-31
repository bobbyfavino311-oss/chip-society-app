---
name: Neon-avatars sprite extraction
description: Rules and quirks for extracting 30 individual 1024×1024 PNGs from neon-avatars.png (1536×1024, 6×5 grid).
---

## Sprite layout
- File: `artifacts/neon-river/assets/images/neon-avatars.png` — 1536×1024
- Grid: 6 cols × 5 rows. CELL_W=256.
- Row Y-starts: 0, 205, 410, 614, 819. Row heights: 205, 205, 204, 205, 205.
- Icon IDs: row-major order (id=1 → col0 row0, id=6 → col5 row0, … id=30 → col5 row4).

## Icon positioning (empirical)
- Col0–Col4: icon CENTER at x = col*256 + 85 (LEFT-BIASED, not the cell midpoint 128).
- Col5: icons are LEFT-BIASED too — effective center ≈ col*256 + 67 (x≈1347). Some col5 icons extend into col4 territory on their left side.
- Row4 (y=819): icons are TOP-ALIGNED — content starts at y=0 within the cell, center ≈ y=71 (not y=102). Content height ≈ 140–144px.
- Exception: Vinyl (id=23) and Compass (id=29) in col4 are SMALL icons — center at (42, 102) and (42, 71) respectively within col4 crop (not 85).

## Contamination root causes
- Col5 icons' left glow bleeds into col4 cells starting at ≈ x=134 in the col4 crop.
- Large col4 icons (Lightning, Rose, Skull) span x=13–157; their artwork merges with col5 glow → looks like one glow, not contamination.
- Small col4 icons (Vinyl id=23, Compass id=29) span only x=2–82; a visible GAP between their artwork and the col5 glow at x=134 makes contamination obvious.
- Row3 col4 icons' bottom glow bleeds into row4 top ≈ y=0–62 in the row4 cell.

## Extraction strategies used
### Standard (col0–col3, most icons)
```
magick SPRITE -crop "256x{h}+{col*256}+{row_y}" +repage
  ( +clone -fill black -colorize 100 -fill white -draw "circle 85,{cy} 85,{cy-r}" )
  -compose Multiply -composite
  -fuzz 0% -trim +repage
  -gravity center -background '#050010' -resize 840x840 -extent 1024x1024
```
Row0–3: cy=102, r=88. Row4: cy=71, r=78.

### Col5 icons (ids 6,12,18,24,30)
Extended crop from x=1236 (44px left of col5 boundary) width=220, to capture left-leaning artwork.
Circular mask at (87, cy) r=75 (row0–3) or r=65 (row4).

### Hourglass (id=28) — left-half mirror
Icon center at (85, 71) in col3 row4. Crop left 86px, flop, +append → 172px symmetric icon.
Circular mask at (86, 71) r=78 → clean full hourglass.

### Vinyl (id=23) — small icon with circular mask
Crop 85×205 at x=1024, y=614. Icon center (42, 102), r=42.
Apply circular mask BEFORE trim (plain trim gives tall-narrow portrait due to outer glow spanning full 205px height).
```
-draw "circle 42,102 42,60"
```

### Compass (id=29) — small icon, direct crop
Crop 85×205 at x=1024, y=819. Icon spans x=2–82, y=0–113.
Apply -fuzz 5% -trim (compass star doesn't suffer the same tall-narrow issue as vinyl).

## Output pipeline (all icons)
After mask+trim: -gravity center -background '#050010' -resize 840x840 -gravity center -background '#050010' -extent 1024x1024

## Key pitfall
PIL/numpy are NOT available in this Replit environment. Use ImageMagick for ALL image processing.
