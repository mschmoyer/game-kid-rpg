# Slime Kingdom - MVP Implementation Plan

**Project Codename:** game-kid-rpg
**Target Audience:** Families (adults 30-45 + children 4-8)
**Genre:** Cozy MMO Turn-Based RPG
**Inspiration:** Dragon Quest (NES), Earthbound, Animal Crossing

---

## 1. MVP Scope Definition

### What We're Building (MVP)
| Feature | Description |
|---------|-------------|
| One Town | "Pebble Village" - hub with shops, inn, NPCs |
| One Dungeon | "Slime Cave" - 3 floors, simple puzzles |
| 5 Monster Types | Slime, Bat, Goblin, Mushroom, Boss Slime King |
| 2-Player Co-op | Online multiplayer, same screen or remote |
| 10 Levels | Simple XP curve, meaningful power growth |
| Basic Equipment | Weapon + Armor + Accessory slots |
| One Boss Fight | Slime King at dungeon end |

### What We're NOT Building (Yet)
- Multiple towns/regions
- PvP combat
- Complex crafting
- Pet/monster taming
- Housing system
- Mobile apps (web-first)

---

## 2. Technical Architecture

### Recommended Stack

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                              │
│  Phaser.js (2D game engine) + HTML5 Canvas              │
│  - Handles rendering, input, animations                  │
│  - Runs in any modern browser                           │
└─────────────────────┬───────────────────────────────────┘
                      │ WebSocket
┌─────────────────────▼───────────────────────────────────┐
│                      SERVER                              │
│  Node.js + Socket.io (real-time multiplayer)            │
│  - Game state synchronization                           │
│  - Combat resolution                                    │
│  - Player matchmaking                                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    DATABASE                              │
│  SQLite (dev) → PostgreSQL (prod)                       │
│  - Player accounts & characters                         │
│  - Inventory & progress                                 │
│  - World state                                          │
└─────────────────────────────────────────────────────────┘
```

### Why This Stack?
- **Phaser.js**: Battle-tested 2D engine, huge community, perfect for retro style
- **Node.js + Socket.io**: Easy real-time sync, JavaScript everywhere
- **SQLite → Postgres**: Start simple, scale when needed
- **Web-first**: No app store approval, plays on any device with a browser

### Alternative: Godot
If Nick prefers a game engine over web tech:
- Godot 4.x with GDScript
- Built-in multiplayer high-level API
- Export to Web, Desktop, Mobile
- Steeper learning curve but more "game engine" feel

---

## 3. Core Systems Design

### 3.1 Game State Machine

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  TITLE   │────▶│   TOWN   │────▶│ DUNGEON  │
│  SCREEN  │     │  (hub)   │◀────│ (explore)│
└──────────┘     └────┬─────┘     └────┬─────┘
                      │                 │
                      ▼                 ▼
                ┌──────────┐     ┌──────────┐
                │   MENU   │     │  COMBAT  │
                │ (pause)  │     │ (battle) │
                └──────────┘     └──────────┘
```

### 3.2 Character Stats (Simplified)

```javascript
Character {
  name: string
  level: 1-10
  class: "Knight" | "Mage" | "Healer"

  // Core stats (kid-friendly names)
  hearts: number      // HP - max = 10 + (level * 5)
  bonkPower: number   // Attack - base damage
  sparkles: number    // MP - spell resource

  // Derived
  defense: number     // From armor
  speed: number       // Turn order

  // Equipment slots
  weapon: Item | null
  armor: Item | null
  accessory: Item | null

  // Progression
  xp: number
  gold: number
}
```

### 3.3 Combat System

**Turn Order:** Speed-based, displayed visually

**Actions (Icon-Based Menu):**
| Action | Icon | Description |
|--------|------|-------------|
| BONK | ⚔️ | Basic attack, always hits |
| MAGIC | ✨ | Class-specific spell |
| ITEM | 🎒 | Use potion/consumable |
| GUARD | 🛡️ | Reduce damage, recover SP |
| RUN | 🏃 | Escape (always works vs normal enemies) |

**Damage Formula (Simple):**
```
damage = attacker.bonkPower - defender.defense + random(-2, 2)
minimum damage = 1
```

**No Death, Just "Bonked":**
- When hearts = 0, character is "dizzy" (knocked out)
- If all party members dizzy → return to town
- Keep all items, XP, gold
- "The slimes bonked you back to town!"

### 3.4 Multiplayer Sync

**What Syncs in Real-Time:**
- Player positions (town/dungeon)
- Combat actions
- Chat/emotes
- Party formation

**What Syncs on Server:**
- Character progression
- Inventory changes
- Quest completion
- World events

**Latency Handling:**
- Client-side prediction for movement
- Server authoritative for combat
- Rollback on desync

---

## 4. Content Specification

### 4.1 Pebble Village (Town)

```
┌─────────────────────────────────────────┐
│           PEBBLE VILLAGE                │
│                                         │
│    [INN]          [SHOP]               │
│      🏨             🏪                  │
│                                         │
│         [FOUNTAIN]                      │
│            ⛲                           │
│     🧍‍♂️    👦    🧙‍♂️                      │
│    (NPC)  (You) (NPC)                  │
│                                         │
│              [CAVE ENTRANCE]            │
│                  🕳️                     │
│                                         │
│    [SAVE POINT]      [QUEST BOARD]     │
│        💾               📋              │
└─────────────────────────────────────────┘
```

**NPCs:**
1. **Innkeeper Molly** - Heals party, save point
2. **Shopkeeper Burt** - Buy/sell equipment
3. **Elder Sage** - Quest giver, tutorial
4. **Wandering Cat** - Hints, flavor text

### 4.2 Slime Cave (Dungeon)

**Floor 1: "Squishy Entrance"**
- 4x4 room grid
- Enemies: Slimes only
- Puzzle: Push block to open door
- Treasure: 1 chest (potion)

**Floor 2: "Mushroom Maze"**
- 5x5 room grid
- Enemies: Slimes, Bats, Mushrooms
- Puzzle: Light torches in order
- Treasure: 2 chests (weapon, gold)

**Floor 3: "Slime King's Throne"**
- Boss arena
- Enemy: Slime King (+ 2 Slime minions)
- Reward: Crown accessory, credits roll

### 4.3 Monster Bestiary

| Monster | Hearts | Bonk | Loot | Behavior |
|---------|--------|------|------|----------|
| Slime | 8 | 3 | 5 gold, Goo | Basic attack only |
| Bat | 6 | 5 | 8 gold, Wing | Can dodge (20%) |
| Goblin | 12 | 6 | 12 gold, Club | May steal item |
| Mushroom | 10 | 4 | 10 gold, Spore | Poison attack |
| **Slime King** | 50 | 10 | Crown, 100 gold | Summons minions |

### 4.4 Equipment List

**Weapons:**
| Name | Bonk Bonus | Cost | Source |
|------|-----------|------|--------|
| Wooden Sword | +2 | 50g | Shop |
| Iron Sword | +5 | 150g | Shop |
| Hero Blade | +8 | -- | Chest F2 |

**Armor:**
| Name | Defense | Cost | Source |
|------|---------|------|--------|
| Cloth Tunic | +1 | 30g | Start |
| Leather Armor | +3 | 100g | Shop |
| Chain Mail | +6 | 250g | Shop |

**Accessories:**
| Name | Effect | Source |
|------|--------|--------|
| Lucky Charm | +10% gold | Shop (200g) |
| Speed Ring | +2 speed | Chest F1 |
| Slime Crown | +5 all stats | Boss drop |

---

## 5. Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup (Phaser.js boilerplate)
- [ ] Basic rendering pipeline
- [ ] Character sprite loading & animation
- [ ] Tile-based movement system
- [ ] Simple town map (walkable)
- [ ] Collision detection

**Deliverable:** Walk around a test town

### Phase 2: Combat Core (Weeks 3-4)
- [ ] Combat state machine
- [ ] Turn-based menu system
- [ ] Basic attack/defend actions
- [ ] Enemy AI (simple)
- [ ] HP/damage display
- [ ] Victory/defeat handling

**Deliverable:** Fight a slime and win/lose

### Phase 3: Progression (Weeks 5-6)
- [ ] XP and leveling system
- [ ] Stat growth on level up
- [ ] Equipment system
- [ ] Inventory UI
- [ ] Shop interface
- [ ] Save/load (local storage)

**Deliverable:** Full single-player loop

### Phase 4: Dungeon (Weeks 7-8)
- [ ] Dungeon map/floors
- [ ] Random encounters
- [ ] Treasure chests
- [ ] Floor transitions
- [ ] Boss fight (Slime King)
- [ ] Credits/ending

**Deliverable:** Complete single-player MVP

### Phase 5: Multiplayer (Weeks 9-12)
- [ ] Server setup (Node.js + Socket.io)
- [ ] Player authentication (simple)
- [ ] Position sync (town/dungeon)
- [ ] Party system
- [ ] Synchronized combat
- [ ] Chat/emotes

**Deliverable:** 2-player online co-op

### Phase 6: Polish (Weeks 13-14)
- [ ] Sound effects & music
- [ ] Screen transitions
- [ ] Tutorial flow
- [ ] Bug fixes
- [ ] Playtesting with actual 4-year-olds
- [ ] Parent controls (play timer)

**Deliverable:** Playable MVP ready for friends & family

---

## 6. Art & Audio Assets

### Art Style Guidelines
- **Resolution:** 16x16 pixel tiles, 32x32 character sprites
- **Palette:** Limited (16-32 colors) for NES feel
- **Animation:** 2-4 frames per action
- **UI:** Big, chunky, high contrast

### Asset Sources (If Not Creating)
- **Sprites:** [OpenGameArt.org](https://opengameart.org) (free)
- **Tiles:** [Kenney.nl](https://kenney.nl) (free, great quality)
- **Music:** [FreeMusicArchive.org](https://freemusicarchive.org)
- **SFX:** [Freesound.org](https://freesound.org)
- **Commission:** Fiverr pixel artists ($50-200 for full set)

### Key Art Needed
1. Hero sprites (3 classes × walk/attack/hurt/victory)
2. Monster sprites (5 types × idle/attack/hurt/death)
3. Town tileset (buildings, paths, props)
4. Dungeon tileset (walls, floors, doors, chests)
5. UI elements (menus, buttons, icons)
6. Effects (slash, magic, heal, levelup)

---

## 7. Kid-Friendly Considerations

### Reading-Optional Design
- All menu options have icons
- Voice barks for actions ("HYAH!", "Ouch!", "Yay!")
- Color coding (red=bad, green=good, blue=magic)
- Number size: BIG

### Accessibility
- No time pressure in combat (turn-based)
- Adjustable text size
- Simple control scheme (4 directions + 2 buttons)
- Color-blind friendly palette

### Safety (For MMO)
- No text chat (preset phrases/emotes only)
- No friend requests from strangers
- Party codes to join family games
- Optional parental time limits

### Positive Reinforcement
- Every battle gives SOMETHING (gold, XP, item)
- Level ups are CELEBRATIONS
- No permanent failure states
- Encouraging NPC dialogue

---

## 8. File Structure

```
game-kid-rpg/
├── planning/
│   ├── IMPLEMENTATION_PLAN.md    (this file)
│   └── GAME_DESIGN_DOC.md        (detailed GDD)
├── mockups/
│   ├── title-screen.html
│   ├── town-view.html
│   ├── combat-screen.html
│   ├── character-menu.html
│   └── dungeon-view.html
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── main.js               (entry point)
│   │   ├── scenes/
│   │   │   ├── TitleScene.js
│   │   │   ├── TownScene.js
│   │   │   ├── DungeonScene.js
│   │   │   ├── CombatScene.js
│   │   │   └── MenuScene.js
│   │   ├── entities/
│   │   │   ├── Player.js
│   │   │   ├── Monster.js
│   │   │   └── NPC.js
│   │   ├── systems/
│   │   │   ├── Combat.js
│   │   │   ├── Inventory.js
│   │   │   └── Progression.js
│   │   └── ui/
│   │       ├── Menu.js
│   │       ├── Dialog.js
│   │       └── HUD.js
│   └── assets/
│       ├── sprites/
│       ├── tiles/
│       ├── audio/
│       └── fonts/
├── server/
│   ├── index.js                  (entry point)
│   ├── game/
│   │   ├── GameRoom.js
│   │   ├── Combat.js
│   │   └── World.js
│   └── db/
│       ├── schema.sql
│       └── queries.js
└── package.json
```

---

## 9. Success Metrics

### MVP Success Criteria
- [ ] 4-year-old can navigate menus with minimal help
- [ ] Two players can complete dungeon together online
- [ ] Full play session under 30 minutes
- [ ] Zero soft-locks or game-breaking bugs
- [ ] Kids ask to play again

### Future Roadmap (Post-MVP)
1. **v1.1** - Second dungeon, 5 more monsters
2. **v1.2** - Pet/companion system
3. **v1.3** - Player housing
4. **v1.4** - Seasonal events
5. **v2.0** - Mobile native apps

---

## 10. Getting Started

### Prerequisites
```bash
# Install Node.js (v18+)
nvm install 18
nvm use 18

# Verify
node --version
npm --version
```

### Quick Start (After MVP Built)
```bash
# Clone and install
cd game-kid-rpg
npm install

# Start development server
npm run dev

# In another terminal, start game server
npm run server

# Open browser to http://localhost:3000
```

---

*Document created for "Crazy Nick's" family RPG project*
*Let's build something the kids will remember forever* 🎮
