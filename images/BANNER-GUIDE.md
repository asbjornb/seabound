# Banner Image Guide

## Generation

Use the **black-forest-labs/flux-2-pro** model on [Replicate](https://replicate.com).

Each banner directory contains a `prompt.txt` — paste that as the prompt.

## Dimensions & Format

- **Size**: 1824 x 320 px (roughly 6:1 ratio)
- **Format**: WebP
- **Filename**: `banner.webp`

## Prompt Structure

All prompts follow this template:

```
Pixel art panoramic island scene, 16-bit retro style, dark moody atmosphere,
horizontal landscape format (6:1 ratio), minimal detail, small scale,
dark ocean background

[Scene description with specific elements, mood, and hex color palette
for sky, primary objects, accents, and ground.]

Keep the overall palette dark — these sit against a #0c1a1a background
Bottom edge should fade to near-black so it bleeds into the UI below
Top edge can fade to the sky color listed (used as --phase-sky in the CSS)
```

Key points:
- Include specific hex colors that match the corresponding CSS theme variables
- Describe the emotional tone (isolation, warmth, triumph, etc.)
- Name concrete visual elements — the model responds well to specifics
- The dark palette + edge fade instructions ensure banners integrate with the UI

## Display

Banners render at 92px tall via `object-fit: cover`, so the vertical center of the image is what players see most. Keep important details in the middle band.

## Directory Layout

```
images/
  phase-0-bare-hands/   prompt.txt  banner.webp
  phase-1-bamboo/       prompt.txt  banner.webp
  phase-2-fire/         prompt.txt  banner.webp
  phase-3-stone-clay/   prompt.txt  banner.webp
  phase-4-maritime/     prompt.txt  banner.webp
  phase-5-voyage/       prompt.txt  banner.webp
  biome-beach/          prompt.txt  banner.webp
  biome-coconut-grove/  prompt.txt  banner.webp
  biome-rocky-shore/    prompt.txt  banner.webp
  biome-bamboo-grove/   prompt.txt  banner.webp
  biome-jungle-interior/prompt.txt  banner.webp
  biome-nearby-island/  prompt.txt  banner.webp
  mainland/             prompt.txt  banner.webp
```
