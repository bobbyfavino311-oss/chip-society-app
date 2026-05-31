---
name: Avatar PNG circular crop in ImageMagick 7
description: How to correctly crop sprite-sheet cells into individual transparent circular PNGs using IM7
---

## Rule
Use `-channel A -fx "..."` to apply a circular alpha mask in IM7. Do NOT use `-compose CopyOpacity` or `-compose DstIn` with a plain-RGB mask image — both produce all-transparent output when the mask has no alpha channel.

## Working command pattern
```bash
magick source.png \
  -crop WxH+X+Y +repage \
  -resize 900x900 \
  -gravity Center -background '#050010' -extent 900x900 \
  -alpha set \
  -channel A \
  -fx "(sqrt((i-450)^2+(j-450)^2)<=442)?1:0" \
  +channel \
  -gravity Center -background none -extent 1024x1024 \
  output.png
```

For a feathered edge (avoids hard circular clip artefact), expand the fx expression inline — IM7 fx does NOT support variable assignment with `;`:
```
"(sqrt((i-450)^2+(j-450)^2)<=420)?1:((sqrt((i-450)^2+(j-450)^2)>=448)?0:((448-sqrt((i-450)^2+(j-450)^2))/(448-420)))"
```

## Why
CopyOpacity in IM7 copies the source's **alpha** channel (not its grayscale intensity) into the destination's alpha. A plain `xc:black`/white draw produces an RGB-only mask (no alpha), so CopyOpacity copies nothing → full transparency. DstIn has the same problem when src has no alpha.

## Reference sprite sheet (neon-avatars.png)
- Dimensions: 1536×1024
- Grid: 6 cols × 5 rows; cell = 256 × 204.8 px
- id→col/row: col=(id-1)%6, row=floor((id-1)/6)
- Row y-starts (integer): [0, 205, 410, 614, 819]
- Adjacent icons' glows overlap across cell boundaries ~20-40px; the circular alpha mask eliminates corner bleed but not glow that extends >442px from center into the 900px canvas
- Output: 30 × 1024×1024 RGBA PNG saved to assets/avatars/avatar_N.png

## In NeonAvatar.tsx
- Static require() map (no dynamic expressions — Metro bundler needs static paths)
- `resizeMode="contain"` on the Image
- Component already clips to circle via borderRadius + overflow:hidden, so the pre-baked alpha is bonus protection
