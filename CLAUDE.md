# CLAUDE.md

Instructions for Claude Code when working on this project.

## Starting the Development Environment

This project requires **two servers** running simultaneously:

```bash
# Terminal 1: Game server (WebSocket + Prisma)
npm run server

# Terminal 2: Vite dev server (Frontend)
npm run dev
```

- Game server runs on port **3001**
- Vite dev server runs on port **5173** (or next available)

## Important: Prisma Schema Changes

When `prisma/schema.prisma` is modified:

1. **Sync the database**: `npx prisma db push`
2. **Restart the game server** - The Prisma client is regenerated and the running server won't pick up changes

If you see errors like `The column 'characters.xyz' does not exist`, run:
```bash
npx prisma db push
# Then restart: kill the server and run `npm run server` again
```

## Project Architecture

### Frontend (Phaser 3)
- `src/scenes/` - Game scenes (TownScene, DungeonScene, CombatScene, etc.)
- `src/ui/` - Reusable UI components (HeartDisplay, ManaDisplay)
- `src/network/NetworkManager.js` - Singleton for all server communication
- `src/data/spells.js` - Spell definitions and helpers

### Backend (Node.js + Socket.IO)
- `server/index.js` - Main server with all socket event handlers
- Uses Prisma ORM for database access

### Database (PostgreSQL + Prisma)
- `prisma/schema.prisma` - Schema definition
- `src/generated/prisma/` - Auto-generated Prisma client
- `db/` - SQL migration files (manual)

### Sprites
- `sprites/` - Source SVG files (organized by type)
- `sprites/png/` - Converted PNG files (including PixelLab AI-generated)
- `sprites/sheets/` - Generated sprite sheets
- `public/` - Final assets used by the game

See `sprites/CLAUDE.md` for sprite creation workflow.

## PixelLab AI Sprite Generation

We use **PixelLab** (https://api.pixellab.ai/mcp/docs) to generate pixel art sprites via MCP tools.

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__pixellab__create_character` | Create character with 4 or 8 directional views |
| `mcp__pixellab__animate_character` | Add walking/attack animations to a character |
| `mcp__pixellab__get_character` | Check status and download completed sprites |
| `mcp__pixellab__list_characters` | List all created characters |

### Generating a New Hero

```javascript
// 1. Create character with 8 directions
mcp__pixellab__create_character({
  description: "fantasy warrior with purple tunic, brown boots, sword on back",
  name: "hero3",
  size: 48,  // Canvas size (character ~60% of this)
  n_directions: 8,
  view: "low top-down",
  detail: "medium detail",
  shading: "basic shading",
  outline: "single color black outline"
})

// 2. Wait 2-3 minutes, then check status
mcp__pixellab__get_character({ character_id: "..." })

// 3. Add walking animation
mcp__pixellab__animate_character({
  character_id: "...",
  template_animation_id: "walking-4-frames"
})
```

### Generating a New Monster

```javascript
mcp__pixellab__create_character({
  description: "green slime monster, gelatinous, bouncy",
  name: "slime3",
  size: 48,
  n_directions: 4,  // Monsters typically need fewer directions
  view: "low top-down"
})
```

### Processing Downloaded Sprites

After downloading the ZIP from PixelLab:

```bash
# 1. Extract to temp directory
unzip /path/to/character.zip -d /tmp/hero-extracted

# 2. Copy rotations to sprites/png/heroes-pixellab/
cp /tmp/hero-extracted/rotations/south.png sprites/png/heroes-pixellab/hero3.png
cp /tmp/hero-extracted/rotations/west.png sprites/png/heroes-pixellab/hero3-left.png
cp /tmp/hero-extracted/rotations/east.png sprites/png/heroes-pixellab/hero3-right.png
cp /tmp/hero-extracted/rotations/north.png sprites/png/heroes-pixellab/hero3-up.png

# 3. Copy animation frames for combat poses
cp /tmp/hero-extracted/animations/walking-4-frames/east/frame_001.png \
   sprites/png/heroes-pixellab/hero3-right-ready.png

# 4. Regenerate sprite sheets
node scripts/generate-spritesheets-v2.cjs

# 5. Copy to public
cp sprites/sheets/heroes2.* public/
```

### Sprite Atlas Organization

We maintain **separate atlases** for PixelLab sprites:
- `heroes.json/png` - Original hand-crafted sprites (knight-*)
- `heroes2.json/png` - PixelLab AI sprites (hero2, hero3, etc.)
- `monsters.json/png` - Original monster sprites
- `monsters2.json/png` - PixelLab monster sprites (slime2, goblin2, etc.)

### Dynamic Atlas Detection

The game automatically selects the correct atlas based on sprite name:

```javascript
// In scene code - atlas is selected by naming convention
const heroAtlas = this.playerSpriteBase.startsWith('hero2') ? 'heroes2' : 'heroes';
const monsterAtlas = enemySprite.endsWith('2') ? 'monsters2' : 'monsters';
```

See `sprites/CLAUDE.md` for detailed sprite integration workflow.

## Common Development Tasks

### Adding a new database field
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Restart the game server

### Adding a new sprite
1. Create SVG in appropriate `sprites/` subdirectory
2. Convert: `rsvg-convert sprites/path/file.svg -o sprites/png/path/file.png`
3. Regenerate sheets: `node scripts/generate-spritesheets-v2.cjs`
4. Copy to public: `cp sprites/sheets/*.png sprites/sheets/*.json public/`

### Adding a new scene
1. Create `src/scenes/NewScene.js`
2. Register in `src/main.js` scene array
3. Use `this.scene.start('NewScene', data)` to navigate

## Code Patterns

### NetworkManager usage
```javascript
import NetworkManager from '../network/NetworkManager.js';

// Get player data
const hp = NetworkManager.getHP();
const gold = NetworkManager.getGold();
const inventory = NetworkManager.getInventory();

// Send events to server
NetworkManager.sendCombatResult(enemyType, outcome, xp, gold, floor, newHp);
NetworkManager.sendSceneChange('SceneName', x, y, dungeonFloor);
```

### Scene transitions with fade
```javascript
this.cameras.main.fadeOut(300, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('NextScene', { data });
});
```

### Phaser scene lifecycle
- `constructor()` - Only called once per scene class
- `init(data)` - Called every time scene starts (reset state here!)
- `create()` - Set up game objects
- `update()` - Game loop

## Testing

- Hard refresh browser (Cmd+Shift+R) after sprite changes
- Check browser console for combat logs and errors
- Use `localStorage.clear()` to reset client-side state (opened chests, etc.)

## Database Reset

To reset a player to defaults:
```sql
UPDATE characters SET
    hp = 10, max_hp = 10, mp = 3, max_mp = 3,
    strength = 1, defense = 0, gold = 0, experience = 0, level = 1
WHERE name = 'playername';
```

## Heroku Deployment

**Live URL**: https://slime-kingdom-game-0602bbdf7ca5.herokuapp.com/

### Deploy to Heroku

```bash
git push heroku main
```

### How Heroku builds and runs the app

1. **Build phase** (`heroku-postbuild` script):
   - `npm run build` - Vite builds frontend to `dist/`
   - `npx prisma generate` - Generates Prisma client
   - `npx prisma db push --accept-data-loss` - Syncs schema to Heroku Postgres

2. **Run phase** (`Procfile`):
   - `web: npm start` runs `NODE_ENV=production node server/index.js`
   - Server serves static files from `dist/` and handles WebSocket connections

### Environment Variables

Heroku sets automatically:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Dynamic port (server binds to this)

### Common Heroku Commands

```bash
# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app in browser
heroku open

# Connect to Postgres
heroku pg:psql

# Restart the app
heroku restart
```

### Troubleshooting Heroku

- **Database errors**: Check `heroku pg:psql` and verify schema
- **WebSocket issues**: Heroku supports WebSockets on `wss://` automatically
- **Build failures**: Check `heroku logs --tail` during deploy
