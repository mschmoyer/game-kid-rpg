import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '../src/generated/prisma/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Serve static files from the Vite build output in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));

    // Serve index.html for all non-API routes (SPA fallback)
    app.get('*', (req, res, next) => {
        // Skip socket.io and API routes
        if (req.url.startsWith('/socket.io')) {
            return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// In-memory cache of connected players: { socketId: { playerId, characterId, ... } }
const connectedPlayers = {};

// Hero sprites to assign to new characters
const heroSprites = ['knight', 'mage', 'healer'];
let nextHeroIndex = 0;

/**
 * Get or create a player by username (simple auth for now)
 */
async function getOrCreatePlayer(username) {
    let player = await prisma.player.findUnique({
        where: { username },
        include: { character: true }
    });

    if (!player) {
        // Create new player
        player = await prisma.player.create({
            data: {
                username,
                isOnline: true
            },
            include: { character: true }
        });
        console.log(`Created new player: ${username}`);
    } else {
        // Update online status
        await prisma.player.update({
            where: { id: player.id },
            data: { isOnline: true, lastLogin: new Date() }
        });
    }

    return player;
}

/**
 * Create a character for a player with starting items
 */
async function createCharacter(playerId, name) {
    const sprite = heroSprites[nextHeroIndex % heroSprites.length];
    nextHeroIndex++;

    const character = await prisma.character.create({
        data: {
            playerId,
            name,
            sprite
        }
    });

    // Give starting items: 2 Healing Potions + 1 Fire Spark spell
    try {
        // Find Healing Potion (id 9 typically, but let's look it up by name)
        const healingPotion = await prisma.itemDefinition.findFirst({
            where: { name: 'Healing Potion' }
        });

        // Find Fire Spark spell
        const fireSpark = await prisma.itemDefinition.findFirst({
            where: { name: 'Fire Spark' }
        });

        if (healingPotion) {
            await prisma.inventory.create({
                data: {
                    characterId: character.id,
                    itemId: healingPotion.id,
                    quantity: 2
                }
            });
            console.log(`Gave ${name} 2x Healing Potion`);
        }

        if (fireSpark) {
            await prisma.inventory.create({
                data: {
                    characterId: character.id,
                    itemId: fireSpark.id,
                    quantity: 1
                }
            });
            console.log(`Gave ${name} 1x Fire Spark`);
        }
    } catch (err) {
        console.warn('Could not give starting items (items may not exist in DB):', err.message);
    }

    console.log(`Created character: ${name} (${sprite})`);
    return character;
}

/**
 * Get character with full data (inventory, equipment)
 */
async function getCharacterFull(characterId) {
    return prisma.character.findUnique({
        where: { id: characterId },
        include: {
            inventory: {
                include: { item: true }
            },
            equipment: {
                include: { item: true }
            }
        }
    });
}

/**
 * Calculate total attack from strength + equipment
 */
function calculateAttack(character) {
    let attack = character.strength || 1;

    // Add weapon bonus
    if (character.equipment) {
        for (const eq of character.equipment) {
            if (eq.item) {
                attack += eq.item.attackBonus || 0;
            }
        }
    }

    return attack;
}

/**
 * Calculate total defense from base + equipment
 */
function calculateDefense(character) {
    let defense = character.defense || 0;

    // Add armor/shield bonuses
    if (character.equipment) {
        for (const eq of character.equipment) {
            if (eq.item) {
                defense += eq.item.defenseBonus || 0;
            }
        }
    }

    return defense;
}

/**
 * Build game state object to send to client
 */
function buildGameState(character) {
    // Calculate XP needed for next level (simple: 100 per level)
    const xpToLevel = character.level * 100;
    const currentLevelXp = character.experience % 100;

    return {
        id: character.id,
        name: character.name,
        sprite: character.sprite,
        scene: character.currentScene,
        position: { x: character.posX, y: character.posY },
        dungeonFloor: character.dungeonFloor,
        stats: {
            level: character.level,
            experience: character.experience,
            xp: currentLevelXp,
            xpToLevel: 100,
            hp: character.hp,
            maxHp: character.maxHp,
            mp: character.mp ?? 10,
            maxMp: character.maxMp ?? 10,
            strength: character.strength,
            attack: calculateAttack(character),  // Calculated from strength + equipment
            defense: calculateDefense(character), // Calculated from base + equipment
            magic: character.magic,
            speed: character.speed
        },
        gold: character.gold,
        statistics: {
            monstersKilled: character.monstersKilled ?? 0,
            battlesWon: character.battlesWon ?? 0,
            battlesLost: character.battlesLost ?? 0,
            timesFled: character.timesFled ?? 0,
            damageDealt: character.damageDealt ?? 0,
            damageTaken: character.damageTaken ?? 0,
            successfulParries: character.successfulParries ?? 0,
            spellsCast: character.spellsCast ?? 0,
            itemsUsed: character.itemsUsed ?? 0,
            goldEarned: character.goldEarned ?? 0,
            deepestFloor: character.deepestFloor ?? 1,
            playTimeSeconds: character.playTimeSeconds ?? 0
        },
        inventory: character.inventory?.map(inv => ({
            itemId: inv.itemId,
            name: inv.item.name,
            description: inv.item.description,
            sprite: inv.item.sprite,
            type: inv.item.itemType,
            slot: inv.item.slot,
            quantity: inv.quantity,
            healAmount: inv.item.healAmount || 0,
            manaRestore: inv.item.manaRestore || 0,
            attackBonus: inv.item.attackBonus || 0,
            defenseBonus: inv.item.defenseBonus || 0,
            magicBonus: inv.item.magicBonus || 0,
            speedBonus: inv.item.speedBonus || 0
        })) || [],
        equipment: character.equipment?.reduce((acc, eq) => {
            if (eq.item) {
                acc[eq.slot] = {
                    itemId: eq.itemId,
                    name: eq.item.name,
                    sprite: eq.item.sprite,
                    attackBonus: eq.item.attackBonus,
                    defenseBonus: eq.item.defenseBonus
                };
            }
            return acc;
        }, {}) || {}
    };
}

/**
 * Get random enemy for a dungeon floor
 */
async function getRandomEnemyForFloor(floor) {
    // Get all enemies that can appear on this floor
    const enemies = await prisma.enemyDefinition.findMany({
        where: {
            minFloor: { lte: floor }
        }
    });

    if (enemies.length === 0) {
        // Fallback to slime if no enemies defined
        return {
            name: 'slime',
            displayName: 'Bouncy Slime',
            sprite: 'slime',
            baseHp: 6,
            attack: 2,
            defense: 0,
            speed: 1,
            baseXp: 10,
            baseGold: 5,
            attackPattern: 'straight',
            approachSpeed: 600,
            telegraphBlinks: 2
        };
    }

    // Random selection weighted toward enemies closer to current floor
    // (higher min_floor enemies are more likely on deeper floors)
    const weights = enemies.map(e => {
        const floorDiff = floor - e.minFloor;
        return Math.max(1, 5 - floorDiff); // Newer enemies have higher weight
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < enemies.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return enemies[i];
        }
    }

    return enemies[enemies.length - 1];
}

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Player login - get or create player, load/create character
     */
    socket.on('login', async ({ username, characterName }) => {
        try {
            const player = await getOrCreatePlayer(username);

            let character = player.character;
            if (!character) {
                // Create character if none exists
                character = await createCharacter(player.id, characterName || username);
            }

            // Load full character data
            character = await getCharacterFull(character.id);

            // Store in connected players cache
            connectedPlayers[socket.id] = {
                playerId: player.id,
                characterId: character.id,
                username: player.username
            };

            // Send game state to player
            const gameState = buildGameState(character);
            socket.emit('gameState', gameState);

            // Notify others about this player
            socket.broadcast.emit('playerJoined', {
                id: socket.id,
                characterId: character.id,
                name: character.name,
                sprite: character.sprite,
                x: character.posX,
                y: character.posY,
                scene: character.currentScene
            });

            // Send current online players to this player
            const onlinePlayers = {};
            for (const [sid, data] of Object.entries(connectedPlayers)) {
                if (sid !== socket.id) {
                    const otherChar = await prisma.character.findUnique({
                        where: { id: data.characterId }
                    });
                    if (otherChar) {
                        onlinePlayers[sid] = {
                            id: sid,
                            characterId: otherChar.id,
                            name: otherChar.name,
                            sprite: otherChar.sprite,
                            x: otherChar.posX,
                            y: otherChar.posY,
                            scene: otherChar.currentScene
                        };
                    }
                }
            }
            socket.emit('currentPlayers', onlinePlayers);

            console.log(`Player ${username} logged in with character ${character.name}`);

        } catch (error) {
            console.error('Login error:', error);
            socket.emit('error', { message: 'Login failed' });
        }
    });

    /**
     * Player movement - update position and broadcast
     */
    socket.on('playerMovement', async ({ x, y }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            // Update position in database
            await prisma.character.update({
                where: { id: playerData.characterId },
                data: { posX: x, posY: y }
            });

            // Broadcast to others
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x, y
            });

        } catch (error) {
            console.error('Movement update error:', error);
        }
    });

    /**
     * Scene change - update current scene and position
     */
    socket.on('sceneChange', async ({ scene, x, y, dungeonFloor }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            const updateData = {
                currentScene: scene,
                posX: x,
                posY: y
            };
            if (dungeonFloor !== undefined) {
                updateData.dungeonFloor = dungeonFloor;
            }

            await prisma.character.update({
                where: { id: playerData.characterId },
                data: updateData
            });

            // Broadcast scene change to others
            socket.broadcast.emit('playerSceneChange', {
                id: socket.id,
                scene,
                x, y
            });

            console.log(`Player ${playerData.username} moved to ${scene}`);

        } catch (error) {
            console.error('Scene change error:', error);
        }
    });

    /**
     * Request enemy encounter data for a floor
     */
    socket.on('requestEnemy', async ({ floor }) => {
        try {
            const enemy = await getRandomEnemyForFloor(floor);
            socket.emit('enemyData', {
                name: enemy.name,
                displayName: enemy.displayName,
                sprite: enemy.sprite,
                hp: enemy.baseHp,
                attack: enemy.attack,
                defense: enemy.defense,
                speed: enemy.speed,
                xpReward: enemy.baseXp,
                goldReward: enemy.baseGold,
                attackPattern: enemy.attackPattern,
                approachSpeed: enemy.approachSpeed,
                telegraphBlinks: enemy.telegraphBlinks
            });
        } catch (error) {
            console.error('Error getting enemy:', error);
        }
    });

    /**
     * Combat outcome - update HP, gold, XP, log combat
     */
    socket.on('combatResult', async ({ enemyType, outcome, experienceGained, goldGained, dungeonFloor, newHp }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            // Get current character
            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            // Calculate new values
            const newExperience = character.experience + (experienceGained || 0);
            const newGold = character.gold + (goldGained || 0);

            // Check for level up (simple: every 100 XP)
            const newLevel = Math.floor(newExperience / 100) + 1;
            const leveledUp = newLevel > character.level;
            const levelsGained = newLevel - character.level;

            // Update character
            const updateData = {
                hp: newHp !== undefined ? newHp : character.hp,
                experience: newExperience,
                gold: newGold,
                level: newLevel
            };

            // Level up bonuses (per level gained)
            const statGains = { maxHp: 0, maxMp: 0, strength: 0, defense: 0, magic: 0 };
            if (leveledUp) {
                statGains.maxHp = 2 * levelsGained;      // +2 max HP per level
                statGains.maxMp = 2 * levelsGained;      // +2 max MP per level
                statGains.strength = 1 * levelsGained;   // +1 strength per level
                statGains.defense = (newLevel % 2 === 0) ? 1 : 0;  // +1 defense every 2 levels
                statGains.magic = (newLevel % 3 === 0) ? 1 : 0;    // +1 magic every 3 levels

                updateData.maxHp = character.maxHp + statGains.maxHp;
                updateData.maxMp = (character.maxMp ?? 10) + statGains.maxMp;
                updateData.hp = updateData.maxHp; // Full heal on level up
                updateData.mp = updateData.maxMp; // Full MP restore on level up
                updateData.strength = character.strength + statGains.strength;
                updateData.defense = character.defense + statGains.defense;
                updateData.magic = character.magic + statGains.magic;
            }

            await prisma.character.update({
                where: { id: playerData.characterId },
                data: updateData
            });

            // Log combat
            await prisma.combatLog.create({
                data: {
                    characterId: playerData.characterId,
                    enemyType,
                    dungeonFloor,
                    outcome,
                    experienceGained: experienceGained || 0,
                    goldGained: goldGained || 0
                }
            });

            // Send updated state to player
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));

            if (leveledUp) {
                socket.emit('levelUp', {
                    newLevel,
                    statGains,
                    newStats: {
                        maxHp: updateData.maxHp,
                        strength: updateData.strength,
                        defense: updateData.defense,
                        magic: updateData.magic
                    }
                });
            }

            console.log(`Combat: ${playerData.username} ${outcome} vs ${enemyType}, +${goldGained}g +${experienceGained}xp`);

        } catch (error) {
            console.error('Combat result error:', error);
        }
    });

    /**
     * Heal at inn - restore HP and MP
     */
    socket.on('restAtInn', async () => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            await prisma.character.update({
                where: { id: playerData.characterId },
                data: {
                    hp: character.maxHp,
                    mp: character.maxMp ?? 10
                }
            });

            // Send updated state
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));

            console.log(`${playerData.username} rested at inn, HP and MP restored`);

        } catch (error) {
            console.error('Rest at inn error:', error);
        }
    });

    /**
     * Use item - consume potion, etc.
     */
    socket.on('useItem', async ({ itemId }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            // Get item and inventory entry
            const inventory = await prisma.inventory.findFirst({
                where: {
                    characterId: playerData.characterId,
                    itemId
                },
                include: { item: true }
            });

            if (!inventory || inventory.quantity < 1) {
                socket.emit('error', { message: 'Item not found' });
                return;
            }

            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            // Apply item effects
            const updateData = {};
            const effects = [];

            // Healing items restore HP
            if (inventory.item.healAmount > 0) {
                // healAmount of 999 means "heal to max"
                const newHp = inventory.item.healAmount >= 999
                    ? character.maxHp
                    : Math.min(character.hp + inventory.item.healAmount, character.maxHp);
                updateData.hp = newHp;
                effects.push(`HP ${newHp}/${character.maxHp}`);
            }

            // Mana items restore MP
            if (inventory.item.manaRestore > 0) {
                const maxMp = character.maxMp ?? 10;
                // manaRestore of 999 means "restore to max"
                const newMp = inventory.item.manaRestore >= 999
                    ? maxMp
                    : Math.min((character.mp ?? 0) + inventory.item.manaRestore, maxMp);
                updateData.mp = newMp;
                effects.push(`MP ${newMp}/${maxMp}`);
            }

            // Update character stats and increment itemsUsed
            updateData.itemsUsed = (character.itemsUsed ?? 0) + 1;

            if (Object.keys(updateData).length > 0) {
                await prisma.character.update({
                    where: { id: playerData.characterId },
                    data: updateData
                });
                console.log(`${playerData.username} used ${inventory.item.name}: ${effects.join(', ')}`);
            }

            // Reduce quantity or remove
            if (inventory.quantity > 1) {
                await prisma.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: inventory.quantity - 1 }
                });
            } else {
                await prisma.inventory.delete({
                    where: { id: inventory.id }
                });
            }

            // Send updated state
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));

        } catch (error) {
            console.error('Use item error:', error);
        }
    });

    /**
     * Cast a spell - deduct MP and track statistics
     */
    socket.on('castSpell', async ({ spellId, mpCost }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            const currentMp = character.mp ?? 10;
            if (currentMp < mpCost) {
                socket.emit('error', { message: 'Not enough MP!' });
                return;
            }

            await prisma.character.update({
                where: { id: playerData.characterId },
                data: {
                    mp: currentMp - mpCost,
                    spellsCast: (character.spellsCast ?? 0) + 1
                }
            });

            // Send updated state
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));

            console.log(`${playerData.username} cast ${spellId}, -${mpCost} MP`);

        } catch (error) {
            console.error('Cast spell error:', error);
        }
    });

    /**
     * Update statistics - increment stat counters
     */
    socket.on('updateStatistics', async (stats) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            const updateData = {};

            // Only update stats that are provided and are incrementable
            if (stats.monstersKilled) updateData.monstersKilled = (character.monstersKilled ?? 0) + stats.monstersKilled;
            if (stats.battlesWon) updateData.battlesWon = (character.battlesWon ?? 0) + stats.battlesWon;
            if (stats.battlesLost) updateData.battlesLost = (character.battlesLost ?? 0) + stats.battlesLost;
            if (stats.timesFled) updateData.timesFled = (character.timesFled ?? 0) + stats.timesFled;
            if (stats.damageDealt) updateData.damageDealt = (character.damageDealt ?? 0) + stats.damageDealt;
            if (stats.damageTaken) updateData.damageTaken = (character.damageTaken ?? 0) + stats.damageTaken;
            if (stats.successfulParries) updateData.successfulParries = (character.successfulParries ?? 0) + stats.successfulParries;
            if (stats.spellsCast) updateData.spellsCast = (character.spellsCast ?? 0) + stats.spellsCast;
            if (stats.itemsUsed) updateData.itemsUsed = (character.itemsUsed ?? 0) + stats.itemsUsed;
            if (stats.goldEarned) updateData.goldEarned = (character.goldEarned ?? 0) + stats.goldEarned;
            if (stats.deepestFloor && stats.deepestFloor > (character.deepestFloor ?? 1)) {
                updateData.deepestFloor = stats.deepestFloor;
            }
            if (stats.playTimeSeconds) updateData.playTimeSeconds = (character.playTimeSeconds ?? 0) + stats.playTimeSeconds;

            if (Object.keys(updateData).length > 0) {
                await prisma.character.update({
                    where: { id: playerData.characterId },
                    data: updateData
                });
            }

        } catch (error) {
            console.error('Update statistics error:', error);
        }
    });

    /**
     * Get shop items - return all purchasable items
     */
    socket.on('getShopItems', async () => {
        try {
            const items = await prisma.itemDefinition.findMany({
                where: {
                    buyPrice: { gt: 0 },
                    itemType: { not: 'spell' }  // Don't sell spells in shop (learned by level)
                },
                orderBy: [
                    { itemType: 'asc' },
                    { buyPrice: 'asc' }
                ]
            });

            socket.emit('shopItems', items);
        } catch (error) {
            console.error('Get shop items error:', error);
            socket.emit('shopItems', []);
        }
    });

    /**
     * Purchase item - buy an item from the shop
     */
    socket.on('purchaseItem', async ({ itemId }) => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) {
            socket.emit('purchaseResult', { success: false, error: 'Not logged in' });
            return;
        }

        try {
            // Get the item definition
            const item = await prisma.itemDefinition.findUnique({
                where: { id: itemId }
            });

            if (!item) {
                socket.emit('purchaseResult', { success: false, error: 'Item not found' });
                return;
            }

            // Get character
            const character = await prisma.character.findUnique({
                where: { id: playerData.characterId }
            });

            // Check if player has enough gold
            if (character.gold < item.buyPrice) {
                socket.emit('purchaseResult', { success: false, error: 'Not enough gold' });
                return;
            }

            // Deduct gold
            await prisma.character.update({
                where: { id: playerData.characterId },
                data: { gold: character.gold - item.buyPrice }
            });

            // Add item to inventory (or increase quantity if stackable)
            if (item.isStackable) {
                const existingItem = await prisma.inventory.findFirst({
                    where: {
                        characterId: playerData.characterId,
                        itemId: item.id
                    }
                });

                if (existingItem) {
                    await prisma.inventory.update({
                        where: { id: existingItem.id },
                        data: { quantity: existingItem.quantity + 1 }
                    });
                } else {
                    await prisma.inventory.create({
                        data: {
                            characterId: playerData.characterId,
                            itemId: item.id,
                            quantity: 1
                        }
                    });
                }
            } else {
                // Non-stackable item - just add to inventory
                await prisma.inventory.create({
                    data: {
                        characterId: playerData.characterId,
                        itemId: item.id,
                        quantity: 1
                    }
                });
            }

            // Send updated game state
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));
            socket.emit('purchaseResult', { success: true, itemName: item.name });

            console.log(`${playerData.username} purchased ${item.name} for ${item.buyPrice}g`);

        } catch (error) {
            console.error('Purchase item error:', error);
            socket.emit('purchaseResult', { success: false, error: 'Purchase failed' });
        }
    });

    /**
     * Return to town - teleport player back to town (used by Return spell)
     */
    socket.on('returnToTown', async () => {
        const playerData = connectedPlayers[socket.id];
        if (!playerData) return;

        try {
            await prisma.character.update({
                where: { id: playerData.characterId },
                data: {
                    currentScene: 'TownScene',
                    posX: 160,
                    posY: 160,
                    dungeonFloor: 1
                }
            });

            // Send updated state
            const updatedCharacter = await getCharacterFull(playerData.characterId);
            socket.emit('gameState', buildGameState(updatedCharacter));
            socket.emit('returnComplete', { scene: 'TownScene', x: 160, y: 160 });

            // Notify others
            socket.broadcast.emit('playerSceneChange', {
                id: socket.id,
                scene: 'TownScene',
                x: 160,
                y: 160
            });

            console.log(`${playerData.username} used Return spell, teleported to town`);

        } catch (error) {
            console.error('Return to town error:', error);
        }
    });

    /**
     * Disconnect - update online status
     */
    socket.on('disconnect', async () => {
        const playerData = connectedPlayers[socket.id];

        if (playerData) {
            try {
                await prisma.player.update({
                    where: { id: playerData.playerId },
                    data: { isOnline: false }
                });
            } catch (error) {
                console.error('Disconnect update error:', error);
            }

            delete connectedPlayers[socket.id];
            console.log(`Player ${playerData.username} disconnected`);
        }

        // Notify others
        io.emit('playerLeft', socket.id);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});

httpServer.listen(PORT, () => {
    console.log(`Slime Kingdom server running on port ${PORT}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
