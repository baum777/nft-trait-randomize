# Surge Bulls & Void Bears - Asset Creation Guide

## Overview

This guide explains how to create and organize the PNG layer assets for the NFT image generation pipeline.

## Asset Requirements

### Technical Specifications

- **Format**: PNG with transparency (RGBA)
- **Dimensions**: 1024 × 1024 pixels
- **Background**: Transparent (alpha channel)
- **Color Space**: sRGB
- **Bit Depth**: 8-bit per channel

### Layer System

The NFT images are composed of 7 layers in the following order (back to front):

1. **Background** - The base layer (can be opaque)
2. **Body** - The character body
3. **Headwear** - Hats, helmets, crowns
4. **Eyes** - Eye styles and effects
5. **Mouth** - Mouth expressions
6. **Accessory** - Items and accessories
7. **Aura** - Top layer effects (particles, glows)

## Directory Structure

Assets must be organized in the following structure:

```
/assets/
├── background/
│   ├── red-crashing-candles.png
│   ├── ordinary-world-apartment.png
│   └── ... (9 total)
├── body/
│   ├── skinny-shaking-newbie.png
│   ├── couch-potato-degen.png
│   └── ... (9 total)
├── eyes/
│   ├── empty-dead-fish-eyes.png
│   ├── bloodshot-fear-eyes.png
│   └── ... (9 total)
├── headwear/
│   ├── broken-paperbag-mask.png
│   ├── ripped-beanie-wif.png
│   └── ... (9 total)
├── mouth/
│   ├── nervous-bite.png
│   ├── paperhand-lip-tremble.png
│   └── ... (9 total)
├── accessory/
│   ├── empty-wallet-chain.png
│   ├── broken-phone.png
│   └── ... (9 total)
└── aura/
    ├── red-blood-drip.png
    ├── weak-grey-smoke.png
    └── ... (9 total)
```

## Complete Asset List

### Background Layer (9 traits)

- `red-crashing-candles.png` - CHAOS
- `ordinary-world-apartment.png` - CHAOS
- `flickering-rugged-basement.png` - CHAOS
- `purple-bleeding-gate.png` - THRESHOLD
- `arena-floor-bloody.png` - THRESHOLD
- `green-candle-rain.png` - THRESHOLD
- `dark-void-storm.png` - ORDEAL_REWARD
- `cosmic-surge-rift.png` - ORDEAL_REWARD
- `infinite-cycle-animated.png` - MYTHIC

### Body Layer (9 traits)

- `skinny-shaking-newbie.png` - CHAOS
- `couch-potato-degen.png` - CHAOS
- `broke-bear-fur.png` - CHAOS
- `standard-chonk.png` - THRESHOLD
- `scarred-and-rug-burned.png` - THRESHOLD
- `veiny-roided-muscle.png` - THRESHOLD
- `diamond-crusted-body.png` - ORDEAL_REWARD
- `void-black-matter-skin.png` - ORDEAL_REWARD
- `transcendent-light-body.png` - MYTHIC

### Eyes Layer (9 traits)

- `empty-dead-fish-eyes.png` - CHAOS
- `bloodshot-fear-eyes.png` - CHAOS
- `paperhands-panic-blink.png` - CHAOS
- `weak-laser-flickering.png` - THRESHOLD
- `classic-red-green-laser.png` - THRESHOLD
- `battle-rage-eyes.png` - THRESHOLD
- `hypno-swirl.png` - ORDEAL_REWARD
- `popping-void-eyes.png` - ORDEAL_REWARD
- `cosmic-galaxy-eyes.png` - MYTHIC

### Headwear Layer (9 traits)

- `broken-paperbag-mask.png` - CHAOS
- `ripped-beanie-wif.png` - CHAOS
- `backward-cap.png` - CHAOS
- `hood-up-threshold.png` - THRESHOLD
- `warband-bandana.png` - THRESHOLD
- `arena-helmet-cracked.png` - THRESHOLD
- `diamond-horns.png` - ORDEAL_REWARD
- `void-crown-of-thorns.png` - ORDEAL_REWARD
- `halo-of-candles.png` - MYTHIC

### Mouth Layer (9 traits)

- `nervous-bite.png` - CHAOS
- `paperhand-lip-tremble.png` - CHAOS
- `cheap-cigarette-hang.png` - CHAOS
- `troll-grin.png` - THRESHOLD
- `grim-determined-bite.png` - THRESHOLD
- `war-scream-mouth.png` - THRESHOLD
- `bloody-fangs.png` - ORDEAL_REWARD
- `rebirth-fire-breath-small.png` - ORDEAL_REWARD
- `flaming-mouth-eternal.png` - MYTHIC

### Accessory Layer (9 traits)

- `empty-wallet-chain.png` - CHAOS
- `broken-phone.png` - CHAOS
- `too-risky-bro-note.png` - CHAOS
- `gold-token-pendant.png` - THRESHOLD
- `ape-goggles.png` - THRESHOLD
- `katana.png` - THRESHOLD
- `sparkfined-journal-page.png` - ORDEAL_REWARD
- `second-journal-glowing.png` - ORDEAL_REWARD
- `ancient-rune-blade.png` - MYTHIC

### Aura Layer (9 traits)

- `red-blood-drip.png` - CHAOS
- `weak-grey-smoke.png` - CHAOS
- `glitch-static-sparks.png` - CHAOS
- `green-candle-drip.png` - THRESHOLD
- `red-green-chaos-mix.png` - THRESHOLD
- `volatile-glitch-storm.png` - THRESHOLD
- `eternal-cycle-fire-small.png` - ORDEAL_REWARD
- `void-particles-rise.png` - ORDEAL_REWARD
- `reality-warping-rift.png` - MYTHIC

## Creating Assets

### Recommended Tools

- **DALL·E 3** / **Midjourney** - For initial asset generation
- **Photoshop** / **GIMP** - For editing and cleanup
- **Aseprite** - For pixel art variants
- **Figma** - For vector-based designs

### Workflow

1. **Generate Base Art**: Use AI tools to create initial concepts
2. **Standardize Size**: Resize/crop to exactly 1024×1024px
3. **Clean Background**: Ensure transparent background (alpha channel)
4. **Align Registration**: Ensure layers align correctly when stacked
5. **Test Composition**: Test with multiple layer combinations
6. **Export**: Save as PNG with transparency

### Design Tips

- **Background Layer**: Can be fully opaque (no transparency needed)
- **Body Layer**: Should be centered and allow room for other layers
- **Eyes/Mouth**: Position consistently across all body variants
- **Headwear**: Design to work with different body types
- **Accessories**: Keep peripheral to avoid overlap conflicts
- **Aura**: Use soft edges and transparency for blending

## Running the Pipeline

### 1. Generate Metadata

```bash
npm run meta:generate
```

This creates `tools/meta-gen/out/metadata/001.json` - `333.json`

### 2. Generate Images

```bash
npm run image:generate
```

This reads the metadata and composites the layers into final images:
`tools/meta-gen/out/images/001.png` - `333.png`

### 3. Run Tests

```bash
npm run meta:test
```

This validates:
- Config integrity (7 layers, 9 traits each)
- Asset filename references
- Image generation with mock assets

## Validation Checklist

Before running the full generation:

- [ ] All 63 assets created (7 layers × 9 traits)
- [ ] All PNGs are exactly 1024×1024 pixels
- [ ] All assets have transparent backgrounds (except background layer)
- [ ] Filenames match exactly with `metaagen-config.json`
- [ ] Assets are in correct subdirectories
- [ ] Test generation with a small sample (e.g., 5 NFTs)
- [ ] Verify layer stacking order visually

## Troubleshooting

### "Missing asset files" Error

Check that:
1. Asset filenames match config exactly (case-sensitive)
2. Assets are in correct layer subdirectories
3. All required assets exist

### Images Look Wrong

Verify:
1. Layer order is correct (background → body → headwear → eyes → mouth → accessory → aura)
2. Transparent backgrounds on all layers except background
3. Asset dimensions are exactly 1024×1024px

### Performance Issues

For faster generation:
- Use SSD storage for assets
- Process in batches
- Optimize PNG compression after generation

## Contact

For questions or issues with the asset pipeline, check the main README or submit an issue.
