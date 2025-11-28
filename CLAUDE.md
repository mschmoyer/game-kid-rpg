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
- `sprites/png/` - Converted PNG files
- `sprites/sheets/` - Generated sprite sheets
- `public/` - Final assets used by the game

See `sprites/CLAUDE.md` for sprite creation workflow.

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
