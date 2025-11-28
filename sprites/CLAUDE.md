# Sprites Directory

This directory contains all source sprites for the game, organized by type.

## Directory Structure

```
sprites/
├── heroes/          # Player character sprites (64x128 pixels)
├── monsters/        # Enemy sprites
├── npcs/            # Non-player characters
├── gear/            # Equipment sprites
├── items/           # Consumable/collectible items
├── effects/         # Visual effects (slash, sparkle, hit, heal)
├── ui/              # UI elements (hearts, buttons, icons)
├── tiles/
│   ├── town/        # Town tileset (32x32 pixels)
│   └── dungeon/     # Dungeon tileset (32x32 pixels)
├── png/             # Converted PNG files (auto-generated)
└── sheets/          # Generated sprite sheets (auto-generated)
```

## Sprite Dimensions

| Type | Dimensions | Notes |
|------|------------|-------|
| Characters (heroes, npcs) | 64x128 | Tall sprites for humanoids |
| Monsters | Varies | Usually 64x64 or 64x128 |
| Tiles | 32x32 | Map tiles use 4x4 pixel blocks |
| Effects | 32x32 or 64x64 | Depends on effect |
| UI Icons | 16x16 or 32x32 | Small icons |

## Creating Pixel Art SVGs

Sprites are created as SVG files using 4x4 pixel blocks for a retro pixel art look.

### SVG Template for Characters (64x128)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 128" width="64" height="128" shape-rendering="crispEdges">
  <!-- Pixel art using 4x4 rect blocks -->
  <rect x="0" y="0" width="4" height="4" fill="#ff0000"/>
  <rect x="4" y="0" width="4" height="4" fill="#00ff00"/>
  <!-- ... more pixels ... -->
</svg>
```

### SVG Template for Tiles (32x32)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">
  <!-- 8x8 grid of 4x4 pixel blocks -->
  <rect x="0" y="0" width="4" height="4" fill="#4a7c4a"/>
  <!-- ... more pixels ... -->
</svg>
```

### Key SVG Attributes

- `shape-rendering="crispEdges"` - Ensures sharp pixel edges, no anti-aliasing
- `viewBox` and `width/height` must match the intended pixel dimensions
- Use 4x4 `<rect>` elements for each "pixel"
- Grid positions: x and y should be multiples of 4 (0, 4, 8, 12, etc.)

### Color Palette Guidelines

- Use hex colors (`fill="#3d4866"`)
- Keep a consistent palette per sprite type
- Common armor colors: `#3d4866` (dark), `#5a6988` (mid), `#8899bb` (highlight)
- Skin tones: `#d4a456` (shadow), `#f4c17a` (base)
- Gold accents: `#a68b29` (dark), `#d4af37` (mid), `#f4d03f` (bright)

## Converting SVG to PNG

Use `rsvg-convert` (from librsvg) to convert SVGs to PNGs:

```bash
# Single file
rsvg-convert sprites/heroes/hero-warrior.svg -o sprites/png/heroes/hero-warrior.png

# All heroes
for f in sprites/heroes/*.svg; do
  name=$(basename "$f" .svg)
  rsvg-convert "$f" -o "sprites/png/heroes/${name}.png"
done

# All tiles
for f in sprites/tiles/town/*.svg; do
  name=$(basename "$f" .svg)
  rsvg-convert "$f" -o "sprites/png/tiles/town/${name}.png"
done
```

### Installing rsvg-convert

```bash
# macOS
brew install librsvg

# Ubuntu/Debian
sudo apt-get install librsvg2-bin
```

## Generating Sprite Sheets

After converting SVGs to PNGs, generate Phaser 3 sprite sheets:

```bash
node scripts/generate-spritesheets-v2.cjs
```

This script:
1. Reads PNGs from `sprites/png/` subdirectories
2. Packs them into sprite sheets with 2px padding
3. Outputs to `sprites/sheets/` as `.png` and `.json` pairs
4. Creates Phaser 3 compatible atlas JSON format

### Sprite Sheet Groups

The generator creates these sprite sheets:
- `heroes.png/json` - from `png/heroes/`
- `monsters.png/json` - from `png/monsters/`
- `gear.png/json` - from `png/gear/`
- `items.png/json` - from `png/items/`
- `npcs.png/json` - from `png/npcs/`
- `ui.png/json` - from `png/ui/`
- `effects.png/json` - from `png/effects/`
- `tiles-town.png/json` - from `png/tiles/town/`
- `tiles-dungeon.png/json` - from `png/tiles/dungeon/`

## Copying to Public Directory

After generating sprite sheets, copy them to `public/` for the game to use:

```bash
cp sprites/sheets/*.png public/
cp sprites/sheets/*.json public/
```

### Frame Name Remapping

**Important:** The game code expects different frame names than the source files use.

| Source (sprites/) | Public (game code) |
|-------------------|-------------------|
| `hero-warrior-*` | `knight-*` |
| `fx-*` (effects) | `fx-*` (same) |

When copying `heroes.json` to `public/`, rename frames:
- `hero-warrior` → `knight`
- `hero-warrior-left` → `knight-left`
- `hero-warrior-right` → `knight-right`
- `hero-warrior-right-ready` → `knight-right-ready`
- `hero-warrior-right-hit` → `knight-right-hit`
- `hero-warrior-right-parry` → `knight-right-parry`
- etc.

## Full Workflow Example

### Adding a New Hero Pose

1. **Create the SVG** in `sprites/heroes/`:
   ```bash
   # Create hero-warrior-right-attack.svg using the 64x128 template
   ```

2. **Convert to PNG**:
   ```bash
   rsvg-convert sprites/heroes/hero-warrior-right-attack.svg \
     -o sprites/png/heroes/hero-warrior-right-attack.png
   ```

3. **Regenerate sprite sheet**:
   ```bash
   node scripts/generate-spritesheets-v2.cjs
   ```

4. **Copy to public with renamed frames**:
   ```bash
   cp sprites/sheets/heroes.png public/
   # Edit public/heroes.json to rename hero-warrior-* to knight-*
   ```

5. **Use in game code**:
   ```javascript
   this.playerSprite.setFrame('knight-right-attack');
   ```

### Adding a New Tile

1. **Create the SVG** in `sprites/tiles/town/` or `sprites/tiles/dungeon/`:
   ```bash
   # Create water.svg using the 32x32 template
   ```

2. **Convert to PNG**:
   ```bash
   rsvg-convert sprites/tiles/town/water.svg \
     -o sprites/png/tiles/town/water.png
   ```

3. **Regenerate sprite sheet**:
   ```bash
   node scripts/generate-spritesheets-v2.cjs
   ```

4. **Copy to public**:
   ```bash
   cp sprites/sheets/tiles-town.png public/
   cp sprites/sheets/tiles-town.json public/
   ```

## Hero Sprite Variants

Current hero sprites and their purposes:

| Frame Name | Purpose |
|------------|---------|
| `knight` | Default/idle (front-facing) |
| `knight-left` | Walking left |
| `knight-right` | Walking right |
| `knight-up` | Walking up/away |
| `knight-right-ready` | Combat ready stance (aggressive crouch) |
| `knight-right-hit` | Taking damage (recoiling) |
| `knight-right-parry` | Blocking/parrying attack |
| `knight-right-attack` | Sword swing attack pose |
| `knight-right-magic` | Casting magic (arms raised, sparkles) |
| `knight-ko` | Knocked out/defeated (lying down with stars, kid-friendly)

## Tips

- Keep SVG files in version control (source of truth)
- PNG and sheet files can be regenerated anytime
- Test sprites in-game after changes - hard refresh browser (Cmd+Shift+R) to clear cache
- Use consistent naming: `{character}-{variant}.svg`
- Effects should use `fx-` prefix in the effects folder
