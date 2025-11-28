# Slime Kingdom

A retro-style RPG built with Phaser 3, featuring turn-based combat with a parry system, dungeon exploration, and multiplayer support.

## Features

- **Town exploration** with NPC interactions (Inn, Shop, Cave entrance)
- **Dungeon crawling** with multiple floors and random encounters
- **Turn-based combat** with Action Points (AP) system
- **Parry mechanic** - time your blocks to gain bonus AP
- **Treasure chests** on dungeon floors 3 and 5
- **Character progression** with leveling, stats, and equipment
- **Multiplayer** - see other players in the same scene

## Tech Stack

- **Frontend**: Phaser 3 + Vite
- **Backend**: Node.js + Socket.IO
- **Database**: PostgreSQL + Prisma ORM
- **Sprites**: Custom pixel art (SVG source files)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- Database `slime_kingdom` created

### Installation

```bash
npm install
```

### Start the Servers

You need to run **two servers** in separate terminals:

**Terminal 1 - Game Server (WebSocket + Database)**
```bash
npm run server
```
This starts the game server on port 3001.

**Terminal 2 - Vite Dev Server (Frontend)**
```bash
npm run dev
```
This starts the frontend on port 5173 (or next available).

### Play the Game

Open http://localhost:5173 in your browser.

## Project Structure

```
game-kid-rpg/
├── src/
│   ├── scenes/          # Phaser scenes (Town, Dungeon, Combat, etc.)
│   ├── ui/              # Shared UI components
│   ├── network/         # NetworkManager for Socket.IO
│   ├── data/            # Game data (spells, items)
│   └── generated/       # Prisma client (auto-generated)
├── server/
│   └── index.js         # Game server with Socket.IO
├── prisma/
│   └── schema.prisma    # Database schema
├── sprites/
│   ├── heroes/          # Character sprites (SVG)
│   ├── monsters/        # Enemy sprites
│   ├── tiles/           # Tileset sprites
│   └── sheets/          # Generated sprite sheets
├── public/              # Static assets (sprite sheets, JSON)
└── db/                  # SQL migrations
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start game server |
| `npm run build` | Build for production |
| `npx prisma db push` | Sync schema to database |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open Prisma database GUI |

## Controls

### Exploration
- **WASD / Arrow Keys** - Move
- **M** - Open menu

### Combat
- **WASD / Arrow Keys** - Navigate actions
- **Enter / Space** - Confirm action
- **Enter** - Parry (during enemy attack)
- **ESC** - Back (in sub-menus)

## Combat System

- Start each turn with 1 AP
- Successful parries grant +1 AP (max 5)
- Actions cost 1 AP each (Attack, Magic, Item, Flee)
- **Guard** uses all AP but doubles defense
- **End Turn** saves remaining AP for next turn

## Heroku Deployment

The game is deployed on Heroku at: https://slime-kingdom-game-0602bbdf7ca5.herokuapp.com/

### Prerequisites

- Heroku CLI installed (`brew tap heroku/brew && brew install heroku`)
- Heroku remote configured: `git remote add heroku https://git.heroku.com/slime-kingdom-game.git`
- Heroku Postgres addon attached (DATABASE_URL set automatically)

### Deploy

```bash
git push heroku main
```

### How It Works

1. **Build**: The `heroku-postbuild` script runs:
   - `npm run build` - Vite builds the frontend to `dist/`
   - `npx prisma generate` - Generates Prisma client
   - `npx prisma db push --accept-data-loss` - Syncs schema to Heroku Postgres

2. **Run**: The `Procfile` starts the server:
   - `web: npm start` runs `NODE_ENV=production node server/index.js`
   - Server serves both static files (from `dist/`) and WebSocket connections

### Useful Commands

```bash
# View logs
heroku logs --tail

# Open the app
heroku open

# Check database
heroku pg:psql

# Restart dynos
heroku restart
```

### Environment Variables

Heroku automatically sets:
- `DATABASE_URL` - PostgreSQL connection string (from Heroku Postgres addon)
- `PORT` - Dynamic port assigned by Heroku
