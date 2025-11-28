# Sprites Directory

This directory contains all source sprites for the game, organized by type.

## Directory Structure

```
sprites/
├── heroes/              # Hand-crafted SVG sprites (64x128 pixels)
├── monsters/            # Hand-crafted monster SVGs
├── npcs/                # Non-player characters
├── gear/                # Equipment sprites
├── items/               # Consumable/collectible items
├── effects/             # Visual effects (slash, sparkle, hit, heal)
├── ui/                  # UI elements (hearts, buttons, icons)
├── tiles/
│   ├── town/            # Town tileset (32x32 pixels)
│   └── dungeon/         # Dungeon tileset (32x32 pixels)
├── png/
│   ├── heroes/          # Converted hand-crafted hero PNGs
│   ├── heroes-pixellab/ # PixelLab AI-generated hero sprites (48x48)
│   ├── monsters/        # Converted hand-crafted monster PNGs
│   ├── monsters-pixellab/ # PixelLab AI-generated monster sprites
│   └── ...
└── sheets/              # Generated sprite sheets (auto-generated)
```

## Sprite Dimensions

| Type | Dimensions | Notes |
|------|------------|-------|
| Hand-crafted heroes | 64x128 | Tall sprites for humanoids |
| PixelLab heroes | 48x48 | AI-generated (character ~29px tall) |
| PixelLab monsters | 48x48 | AI-generated |
| Hand-crafted monsters | Varies | Usually 64x64 or 64x128 |
| Tiles | 32x32 | Map tiles use 4x4 pixel blocks |
| Effects | 32x32 or 64x64 | Depends on effect |
| UI Icons | 16x16 or 32x32 | Small icons |

## Two Sprite Creation Methods

### Method 1: Hand-Crafted SVG (Original)
- Create SVG files with 4x4 pixel blocks
- Convert to PNG with `rsvg-convert`
- Good for: tiles, UI, custom artwork

### Method 2: PixelLab AI Generation (Recommended for characters)
- Use MCP tools to generate pixel art
- Download and extract from ZIP
- Good for: heroes, monsters, NPCs with multiple directions/animations

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

---

## PixelLab AI Sprite Generation

We use **PixelLab** (https://api.pixellab.ai/mcp/docs) to generate pixel art sprites via MCP tools. This is the recommended method for creating new heroes and monsters.

### Why Use PixelLab?

- Generates consistent 8-directional sprites automatically
- Creates animation frames (walking, attacking, etc.)
- Produces game-ready pixel art in 48x48 canvas
- Much faster than hand-crafting each direction

### Available Animation Templates

For `mcp__pixellab__animate_character`:

| Template ID | Frames | Use For |
|-------------|--------|---------|
| `walking-4-frames` | 4 | Standard walk cycle |
| `walking-6-frames` | 6 | Smoother walk |
| `walking-8-frames` | 8 | Detailed walk |
| `running-4-frames` | 4 | Run animation |
| `breathing-idle` | varies | Idle stance |
| `fight-stance-idle-8-frames` | 8 | Combat ready |
| `lead-jab` | varies | Attack |
| `high-kick` | varies | Attack |
| `fireball` | varies | Magic attack |

### Complete Workflow: Adding a New PixelLab Hero

#### Step 1: Generate the Character

```javascript
// Use mcp__pixellab__create_character
mcp__pixellab__create_character({
  description: "fantasy warrior with purple tunic, brown leather boots, sword on back, heroic pose",
  name: "hero3",
  size: 48,
  n_directions: 8,
  view: "low top-down",
  detail: "medium detail",
  shading: "basic shading",
  outline: "single color black outline",
  proportions: '{"type": "preset", "name": "default"}'
})
```

**Wait 2-3 minutes** for generation to complete.

#### Step 2: Check Status & Get Download URL

```javascript
mcp__pixellab__get_character({ character_id: "abc123...", include_preview: true })
```

This returns the ZIP download URL when complete.

#### Step 3: (Optional) Add Animations

```javascript
// Add walking animation for all 8 directions
mcp__pixellab__animate_character({
  character_id: "abc123...",
  template_animation_id: "walking-4-frames",
  animation_name: "walk"
})
```

**Wait another 2-4 minutes** for animation generation.

#### Step 4: Download and Extract

```bash
# Download the ZIP (use URL from get_character)
curl -o /tmp/hero3.zip "https://..."

# Extract
unzip /tmp/hero3.zip -d /tmp/hero3-extracted
```

#### Step 5: Copy Sprites with Correct Naming

The ZIP contains:
- `rotations/` - Static directional views (south, west, east, north, etc.)
- `animations/` - Animated sequences by direction

```bash
# Copy directional sprites to heroes-pixellab folder
cp /tmp/hero3-extracted/rotations/south.png sprites/png/heroes-pixellab/hero3.png
cp /tmp/hero3-extracted/rotations/west.png sprites/png/heroes-pixellab/hero3-left.png
cp /tmp/hero3-extracted/rotations/east.png sprites/png/heroes-pixellab/hero3-right.png
cp /tmp/hero3-extracted/rotations/north.png sprites/png/heroes-pixellab/hero3-up.png

# Copy combat poses from animation frames
cp /tmp/hero3-extracted/animations/walking-4-frames/east/frame_001.png \
   sprites/png/heroes-pixellab/hero3-right-ready.png
cp /tmp/hero3-extracted/animations/walking-4-frames/east/frame_002.png \
   sprites/png/heroes-pixellab/hero3-right-hit.png
cp /tmp/hero3-extracted/animations/walking-4-frames/east/frame_003.png \
   sprites/png/heroes-pixellab/hero3-right-parry.png

# Create KO frame (copy from hit frame or create custom)
cp sprites/png/heroes-pixellab/hero3-right-hit.png sprites/png/heroes-pixellab/hero3-ko.png
```

#### Step 6: Regenerate Sprite Sheets

```bash
node scripts/generate-spritesheets-v2.cjs
```

This reads from `sprites/png/heroes-pixellab/` and generates `sprites/sheets/heroes2.json/png`.

#### Step 7: Copy to Public

```bash
cp sprites/sheets/heroes2.json sprites/sheets/heroes2.png public/
```

#### Step 8: Update Game Code (if needed)

If adding a new hero type, update:

**server/index.js** - Add to available sprites:
```javascript
const heroSprites = ['hero2', 'hero3'];
```

**Database** - Update character sprite:
```sql
UPDATE characters SET sprite = 'hero3' WHERE name = 'playername';
```

The game's dynamic atlas detection will automatically use `heroes2` atlas for any sprite starting with `hero2` or `hero3`.

### Complete Workflow: Adding a New PixelLab Monster

#### Step 1: Generate the Monster

```javascript
mcp__pixellab__create_character({
  description: "fierce goblin warrior with green skin, leather armor, holding a wooden club",
  name: "goblin3",
  size: 48,
  n_directions: 4,  // Monsters only need 4 directions for combat
  view: "low top-down",
  detail: "medium detail",
  shading: "basic shading"
})
```

#### Step 2-4: Same as hero (wait, check, download)

#### Step 5: Copy with Monster Naming

```bash
# Monsters only need the front-facing sprite for combat
cp /tmp/goblin3-extracted/rotations/south.png sprites/png/monsters-pixellab/goblin3.png
```

#### Step 6-7: Regenerate and Copy

```bash
node scripts/generate-spritesheets-v2.cjs
cp sprites/sheets/monsters2.json sprites/sheets/monsters2.png public/
```

#### Step 8: Add to Database

Update `db/init-db-data.sql`:
```sql
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks)
VALUES ('goblin3', 'Goblin Warrior', 'goblin3', 10, 4, 2, 2, 20, 12, 2, 'pause', 500, 2);
```

Then reload:
```bash
psql $DATABASE_URL -f db/init-db-data.sql
```

### Sprite Sheet Generator Groups

The `scripts/generate-spritesheets-v2.cjs` handles these groups:

```javascript
const groups = [
    { name: 'monsters', dir: 'monsters' },
    { name: 'heroes', dir: 'heroes' },
    { name: 'monsters2', dir: 'monsters-pixellab' },   // PixelLab monsters
    { name: 'heroes2', dir: 'heroes-pixellab' },       // PixelLab heroes
    { name: 'gear', dir: 'gear' },
    // ...
];
```

### Frame Naming Conventions

| Sprite Type | Atlas | Frame Names |
|-------------|-------|-------------|
| Hand-crafted hero | `heroes` | `knight`, `knight-left`, `knight-right-ready`, etc. |
| PixelLab hero | `heroes2` | `hero2`, `hero2-left`, `hero2-right-ready`, etc. |
| Hand-crafted monster | `monsters` | `slime`, `goblin`, etc. |
| PixelLab monster | `monsters2` | `slime2`, `goblin2`, `skeleton2`, etc. |

### Dynamic Atlas Selection in Game

The game automatically selects the correct atlas based on naming:

**TownScene.js / DungeonScene.js:**
```javascript
const heroAtlas = this.playerSpriteBase.startsWith('hero2') ? 'heroes2' : 'heroes';
this.player = this.physics.add.sprite(x, y, heroAtlas, this.playerSpriteBase);
this.player.setScale(heroAtlas === 'heroes2' ? 1.0 : 0.5);
```

**CombatScene.js:**
```javascript
// Hero
this.heroAtlas = this.playerSpriteBase.startsWith('hero2') ? 'heroes2' : 'heroes';
this.playerSprite.setScale(this.heroAtlas === 'heroes2' ? 3.5 : 1.5);

// Monster
const monsterAtlas = enemySprite.endsWith('2') ? 'monsters2' : 'monsters';
this.enemySprite.setScale(monsterAtlas === 'monsters2' ? 1.0 : 1.25);
```

### Troubleshooting PixelLab

**Character generation fails:**
- Check your PixelLab subscription status
- Try simpler descriptions
- Reduce `n_directions` to 4

**Sprites look wrong in game:**
- Verify frame names match expected pattern
- Check atlas is loaded in `BootScene.js`
- Hard refresh browser (Cmd+Shift+R)

**Animation frames missing:**
- Ensure animation completed (check `get_character`)
- Animation ZIP structure: `animations/{template-id}/{direction}/frame_000.png`

**Sprite too small/large:**
- Adjust scale in scene code
- PixelLab 48x48 canvas needs ~2x scale in exploration, ~3.5x in combat
