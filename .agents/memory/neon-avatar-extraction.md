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
- Col0–Col3: icon CENTER at x = col*256 + 85 (LEFT-BIASED, not 128).
- Col4: MIXED — most icons centered at x=1109 (x=85 in crop) BUT Skull (id=17) centered at x≈67 and Vinyl (id=23) / Compass (id=29) are SMALL icons centered at x=42.
- Col5: icons LEFT-BIASED — effective center ≈ x=1323 (x=43 in standard col5 crop). Icons overhang into col4 on their left side; use extended crop starting at x=1236, w=220.
- Row0–3: icon vertical center at cy=102 within each cell.
- Row4 (y=819): icons TOP-ALIGNED — content starts at y=0, center ≈ y=71 (not y=102). Content height ≈ 140px.

## Contamination root causes
1. **Col5 → col4 (horizontal)**: col5 icon glow bleeds left into col4 crop starting at x=134. Skull (id=17) sits at x=5–129 (center x=67), safely left of x=134. Small icons Vinyl/Compass (center x=42) also safe.
2. **Row4 → row3 (vertical)**: row4 icons have large decorative circle rings whose glow bleeds UP into row3 cells starting at y≈111 in the row3 crop. Visible as a horizontal arc at the bottom of Fire/Ace/Wolf icons.
3. **Col5 Viper (id=24)**: left portion of car artwork bleeds into col4; fixed by extended col5 crop.

## Extraction strategies — FINAL

### Standard icons (col0–col3, rows 0–2)
```
magick SPRITE -crop "256x{h}+{col*256}+{row_y}" +repage
  ( +clone -fill black -colorize 100 -fill white -draw "circle 85,102 85,14" )
  -compose Multiply -composite
  -fuzz 5% -trim +repage
  -gravity center -background '#050010' -resize 840x840 -extent 1024x1024
```

### Row3 icons — shifted mask to avoid row4 ring glow (ids 19, 20, 21, 22)
Row4 icons' circle rings glow upward into row3 starting at y≈156. Shift mask center UP:
- Mask: `circle 85,75 85,-5` → radius 80, bottom at y=155. Excludes contamination zone.
- Use `-fuzz 7% -trim` to also remove dark background margins within mask.
- Crown (id=22): own ring design is correct — standard mask is fine, circle arc is Crown's artwork.

### Row4 icons (ids 25–30) — top-aligned, cy=71
- Standard row4: `circle 85,71 85,-7` (r=78)
- Hourglass (id=28): left-half mirror — crop 86px col3, flop, +append, mask `circle 86,71 86,-7`
- Compass (id=29): small icon at (42,71); mask `circle 42,71 42,29` BEFORE trim
- Tiger Eye (id=30): extended crop x=1236 w=220; mask `circle 87,71 87,-14` (r=85), `-fuzz 7% -trim`

### Col5 icons (ids 6, 12, 18, 24, 30)
- Extended crop: x=1236, w=220 (captures left-leaning artwork that bleeds into col4)
- Row0–3: mask `circle 87,102 87,17` (r=85); `-fuzz 7% -trim`
- Viper (id=24) row3: mask `circle 87,75 87,-5` (r=80) — also needs shifted mask for row4 bleed
- Tiger Eye (id=30) row4: mask `circle 87,71 87,-14` (r=85); `-fuzz 7% -trim`

### Skull (id=17) — col4 row2, non-standard center
- Center at x≈67 (not x=85). Ring radius ≈67px. Saturn glow starts at x=134.
- Full 256px crop; mask `circle 67,102 134,102` (center→edge to x=134, Saturn boundary)
- `-fuzz 7% -trim` removes dark margins and faint outer contamination

### Vinyl (id=23) — small icon, col4 row3
- Crop 85×205 at x=1024 y=614. Mask `circle 42,102 42,60` (r=42) BEFORE trim.
- Plain trim gives portrait artifact; circular mask first forces square bounding box.

## Output pipeline (all icons)
```
-gravity center -background '#050010' -resize 840x840
-gravity center -background '#050010' -extent 1024x1024
```

## Key pitfalls
- PIL/numpy NOT available. Use ImageMagick for ALL image processing.
- `-fuzz 7% -trim` removes the dark sprite background (#050010, ≈6.6% from black) from inside the mask — essential for icons with internal dark margins (Tiger Eye, Skull).
- Circle draw syntax: `circle cx,cy ex,ey` where radius = distance(center, edge). Use `circle 85,102 85,14` for r=88 (not `circle 85,102 r=88`).
- Skull has TWO SKULLS if you crop 86px (includes skull center pixel twice after mirror). Always crop exactly to the center, never including it.
- Row4 row-heights: row4 is 205px tall (y=819 to y=1024), not 204.
