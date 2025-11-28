# Slime Kingdom - Multiplayer Setup

This game now supports 2-player multiplayer using Socket.io!

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Multiplayer Server
In one terminal window:
```bash
npm run server
```

The server will run on port 3000.

### 3. Start the Game Client
In another terminal window:
```bash
npm run dev
```

The game will open in your browser on port 8080.

### 4. Test Multiplayer
- Open the game in two different browser windows (or tabs)
- Each player will be assigned a different hero sprite (knight, mage, or healer)
- Move around with arrow keys or WASD
- You'll see other players moving in real-time!

## Features

- **Automatic sprite assignment**: First player gets knight, second gets mage, third gets healer
- **Real-time position sync**: Player positions are synced every 100ms when they move
- **Graceful degradation**: If the server isn't running, the game still works in single-player mode
- **Visual distinction**: Other players appear slightly transparent (80% opacity)
- **Collision-free**: Other players are visual-only and don't block movement

## Architecture

### Server (`server/index.js`)
- Express + Socket.io server on port 3000
- Tracks all connected players with their positions and sprite assignments
- Broadcasts player movements to all other clients
- Handles player join/leave events

### Client (`src/network/NetworkManager.js`)
- Singleton class managing the Socket.io connection
- Provides clean API for sending/receiving multiplayer events
- Gracefully handles connection failures

### Game Integration (`src/scenes/TownScene.js`)
- Connects to server on scene creation
- Sends local player position updates
- Renders other players' sprites
- Manages other player lifecycle (join/move/leave)

## Troubleshooting

### "Failed to connect to multiplayer server"
Make sure the server is running with `npm run server` before starting the game.

### Players not syncing
- Check that both the server and client are running
- Look at the browser console for error messages
- Verify port 3000 is not blocked by firewall

### Game runs slowly
The position update rate is throttled to 100ms. You can adjust this in `TownScene.js` by changing `this.positionUpdateDelay`.

## Future Enhancements

Potential improvements for the multiplayer system:
- Chat system
- Player names/labels
- Smooth interpolation for other players' movement
- More sophisticated collision detection
- Rooms/channels for multiple game instances
- Player animations synchronized
