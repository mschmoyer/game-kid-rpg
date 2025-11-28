import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH } from '../constants.js';
import HeartDisplay from '../ui/HeartDisplay.js';
import ManaDisplay from '../ui/ManaDisplay.js';
import MobileControls from '../ui/MobileControls.js';

export default class DungeonScene extends Phaser.Scene {
    constructor() {
        super('DungeonScene');
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.speed = 80;
        this.floor = 1;
        this.floorText = null;
        this.encounterChance = 0.10; // 10% chance per move
        this.lastPlayerTile = { x: 0, y: 0 };

        // Player sprite direction
        this.playerSpriteBase = null;
        this.playerDirection = 'down'; // down, up, left, right

        // Treasure chest system
        this.chest = null;
        this.chestPos = null;
        this.chestOpened = false;
    }

    init(data) {
        this.floor = data.floor || 1;
        // Store return position from combat (if any)
        this.returnX = data.playerX || null;
        this.returnY = data.playerY || null;
        // Reset transition flag (scene instance is reused)
        this.isTransitioning = false;
        // Check if chest was opened (persisted in localStorage per floor)
        this.chestOpened = this.isChestOpened(this.floor);
    }

    create() {
        const tileSize = 32;
        const gridWidth = 10;
        const gridHeight = 9;

        // Dark background
        this.cameras.main.setBackgroundColor('#0a0a15');

        // Create dungeon layout
        // 0 = floor, 1 = wall, 2 = stairs up, 3 = stairs down, 4 = torch
        const layout = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 0, 0, 0, 0, 0, 0, 4, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 0, 0, 0, 0, 0, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];

        // Track floor tiles for decorations
        const floorTiles = [];

        // Create static group for walls
        this.walls = this.physics.add.staticGroup();

        // Render the dungeon - floor tiles first
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const tileX = x * tileSize + tileSize / 2;
                const tileY = y * tileSize + tileSize / 2;
                const tile = layout[y][x];

                // Always place floor tile
                this.add.sprite(tileX, tileY, 'tiles-dungeon', 'floor-stone');

                if (tile === 1) {
                    // Wall (use wall-stone for all walls, or wall-corner for corners)
                    const isCorner = (x === 0 || x === gridWidth - 1) && (y === 0 || y === gridHeight - 1);
                    const wallFrame = isCorner ? 'wall-corner' : 'wall-stone';

                    const wall = this.walls.create(tileX, tileY, 'tiles-dungeon', wallFrame);
                    wall.body.setSize(28, 28);
                    wall.refreshBody();
                } else if (tile === 2) {
                    // Stairs up (exit to town)
                    this.stairsUp = this.add.sprite(tileX, tileY, 'tiles-dungeon', 'stairs-up');
                    this.stairsUpPos = { x: tileX, y: tileY };
                } else if (tile === 3) {
                    // Stairs down (go deeper)
                    this.stairsDown = this.add.sprite(tileX, tileY, 'tiles-dungeon', 'stairs-down');
                    this.stairsDownPos = { x: tileX, y: tileY };
                } else if (tile === 4) {
                    // Torch decoration
                    this.add.sprite(tileX, tileY, 'tiles-dungeon', 'torch-wall');
                } else if (tile === 0) {
                    // Track empty floor tiles for random decorations
                    floorTiles.push({ x: tileX, y: tileY });
                }
            }
        }

        // Add sparse random decorations (2-4 items)
        const decorations = ['bones', 'rubble', 'floor-cracked'];
        const numDecorations = 2 + Math.floor(Math.random() * 3);
        const usedPositions = new Set();

        for (let i = 0; i < numDecorations && floorTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * floorTiles.length);
            const pos = floorTiles[idx];
            const key = `${pos.x},${pos.y}`;

            // Don't place on player start position or already used
            if (!usedPositions.has(key) && pos.x > 80) {
                usedPositions.add(key);
                const deco = decorations[Math.floor(Math.random() * decorations.length)];
                this.add.sprite(pos.x, pos.y, 'tiles-dungeon', deco).setAlpha(0.6);
            }
        }

        // ===== Treasure Chests (floors 3 and 5) =====
        if (this.floor === 3 || this.floor === 5) {
            // Place chest in center-right of room
            const chestX = 7 * tileSize + tileSize / 2;  // Column 7
            const chestY = 4 * tileSize + tileSize / 2;  // Row 4 (middle)
            this.chestPos = { x: chestX, y: chestY };

            // Show closed or open sprite based on state
            const chestFrame = this.chestOpened ? 'chest-open' : 'chest-closed';
            this.chest = this.add.sprite(chestX, chestY, 'tiles-dungeon', chestFrame);

            console.log(`Treasure chest spawned on floor ${this.floor} at (${chestX}, ${chestY}) - ${this.chestOpened ? 'already opened' : 'closed'}`);
        } else {
            this.chest = null;
            this.chestPos = null;
        }

        // Create player - use return position from combat, or default near stairs
        const startX = this.returnX || (this.stairsUpPos.x + tileSize);
        const startY = this.returnY || this.stairsUpPos.y;
        this.playerSpriteBase = NetworkManager.getSprite();
        // Use heroes2 atlas for hero2 sprites, otherwise heroes atlas
        const heroAtlas = this.playerSpriteBase.startsWith('hero2') ? 'heroes2' : 'heroes';
        this.player = this.physics.add.sprite(
            startX,
            startY,
            heroAtlas,
            this.playerSpriteBase
        );
        // Scale: hero2 (48px) needs 1.0, original (64x128) needs 0.5
        this.player.setScale(heroAtlas === 'heroes2' ? 1.0 : 0.5);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(32, 32);  // Match tile size for consistent collisions

        // Set up collision with walls
        this.physics.add.collider(this.player, this.walls);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Track player's starting tile
        this.lastPlayerTile = {
            x: Math.floor(this.player.x / tileSize),
            y: Math.floor(this.player.y / tileSize)
        };

        // Floor indicator
        this.floorText = this.add.text(8, 8, `Floor ${this.floor}`, {
            font: '10px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });

        // Dungeon name (in game area)
        this.add.text(160, 276, 'Slime Cave', {
            font: '10px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0.5);

        // UI Panel background
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x1a1a2e, 1);
        uiPanel.fillRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);

        // Add border line at top of UI panel
        uiPanel.lineStyle(2, 0x3a3a5e, 1);
        uiPanel.lineBetween(0, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT);

        // ===== HP/MP Display =====
        // Hearts display using shared HeartDisplay component
        this.playerHeartDisplay = new HeartDisplay(this, 30, GAME_HEIGHT + 15, 22, 0.9);

        // Mana display using shared ManaDisplay component (below hearts)
        this.playerManaDisplay = new ManaDisplay(this, 30, GAME_HEIGHT + 32, 18, 0.7);

        this.updateHearts();

        // Gold and Level display
        this.goldText = this.add.text(20, GAME_HEIGHT + 49, '', {
            font: '10px monospace',
            fill: '#ffdd00'
        });
        this.levelText = this.add.text(100, GAME_HEIGHT + 49, '', {
            font: '10px monospace',
            fill: '#aaaaff'
        });
        this.updateStatsText();

        // ===== Menu Button =====
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0x3a3a5e, 1);
        menuBg.fillRoundedRect(240, GAME_HEIGHT + 10, 70, 45, 5);
        menuBg.lineStyle(2, 0x5a5a8e, 1);
        menuBg.strokeRoundedRect(240, GAME_HEIGHT + 10, 70, 45, 5);

        const menuButton = this.add.text(275, GAME_HEIGHT + 32, '📋 Menu', {
            font: '11px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerdown', () => this.openMenu());
        menuButton.on('pointerover', () => menuButton.setColor('#ffff00'));
        menuButton.on('pointerout', () => menuButton.setColor('#ffffff'));

        // Add M key shortcut for menu
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        // ===== Location and hints =====
        this.statusText = this.add.text(20, GAME_HEIGHT + 65, '', {
            font: '10px monospace',
            fill: '#aaaaaa',
            wordWrap: { width: 200 }
        });
        this.updateStatusText();

        // Mobile controls D-pad at bottom of screen (no action button - interactions are automatic)
        this.mobileControls = new MobileControls(this, false);

        // Fade in when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);

        console.log(`Entered Slime Cave - Floor ${this.floor}`);
    }

    update() {
        if (!this.player) return;

        // Check M key for menu
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.openMenu();
            return;
        }

        // Reset velocity
        this.player.setVelocity(0);

        // Check for movement input (keyboard + mobile controls)
        const left = this.cursors.left.isDown || this.wasd.left.isDown || this.mobileControls.left;
        const right = this.cursors.right.isDown || this.wasd.right.isDown || this.mobileControls.right;
        const up = this.cursors.up.isDown || this.wasd.up.isDown || this.mobileControls.up;
        const down = this.cursors.down.isDown || this.wasd.down.isDown || this.mobileControls.down;

        if (left) {
            this.player.setVelocityX(-this.speed);
            this.playerDirection = 'left';
        } else if (right) {
            this.player.setVelocityX(this.speed);
            this.playerDirection = 'right';
        }

        if (up) {
            this.player.setVelocityY(-this.speed);
            this.playerDirection = 'up';
        } else if (down) {
            this.player.setVelocityY(this.speed);
            this.playerDirection = 'down';
        }

        // Normalize diagonal movement
        if ((left || right) && (up || down)) {
            this.player.body.velocity.normalize().scale(this.speed);
        }

        // Update sprite frame based on direction
        this.updatePlayerSprite();

        // Check tile-based events
        const currentTile = {
            x: Math.floor(this.player.x / 32),
            y: Math.floor(this.player.y / 32)
        };

        // Only check events when player moves to a new tile
        if (currentTile.x !== this.lastPlayerTile.x || currentTile.y !== this.lastPlayerTile.y) {
            this.lastPlayerTile = currentTile;
            this.checkTileEvents();
        }
    }

    checkTileEvents() {
        if (this.isTransitioning) return;

        const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const playerPos = { x: this.player.x, y: this.player.y };

        // Check stairs up (go up one floor, or return to town from floor 1)
        if (dist(playerPos, this.stairsUpPos) < 28) {
            this.isTransitioning = true;
            if (this.floor === 1) {
                console.log('Taking stairs up - returning to town');
                NetworkManager.sendSceneChange('TownScene', 296, 230, null);
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('TownScene', { startX: 296, startY: 230 });
                });
            } else {
                const newFloor = this.floor - 1;
                console.log(`Taking stairs up - going to floor ${newFloor}`);
                const spawnX = 240;
                const spawnY = 240;
                NetworkManager.sendSceneChange('DungeonScene', spawnX, spawnY, newFloor);
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.restart({ floor: newFloor, playerX: spawnX, playerY: spawnY });
                });
            }
            return;
        }

        // Check stairs down (go deeper)
        if (dist(playerPos, this.stairsDownPos) < 28) {
            this.isTransitioning = true;
            const newFloor = this.floor + 1;
            console.log(`Taking stairs down - going to floor ${newFloor}`);
            const spawnX = 112;
            const spawnY = 48;
            NetworkManager.sendSceneChange('DungeonScene', spawnX, spawnY, newFloor);
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.restart({ floor: newFloor, playerX: spawnX, playerY: spawnY });
            });
            return;
        }

        // Check treasure chest
        if (this.chestPos && !this.chestOpened && dist(playerPos, this.chestPos) < 28) {
            this.openChest();
            return;
        }

        // Random encounter check (10% chance)
        if (Math.random() < this.encounterChance) {
            this.startRandomEncounter();
        }
    }

    async startRandomEncounter() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        console.log(`Requesting enemy for floor ${this.floor}...`);

        // Get enemy data from server (or fallback)
        const enemyData = await NetworkManager.requestEnemy(this.floor);

        console.log(`Random encounter: ${enemyData.displayName}!`);

        // Fade out then start combat
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('CombatScene', {
                enemyData: enemyData,
                returnScene: 'DungeonScene',
                returnData: {
                    floor: this.floor,
                    playerX: this.player.x,
                    playerY: this.player.y
                },
                playerHP: NetworkManager.getHP(),
                playerMaxHP: NetworkManager.getMaxHP()
            });
        });
    }

    updateStatusText() {
        this.statusText.setText(
            `Floor ${this.floor} - Slime Cave\n\n` +
            `Explore the dungeon. Watch for monsters!\n` +
            `Find stairs to go deeper or return to town.`
        );
    }

    /**
     * Updates the player sprite frame based on facing direction
     */
    updatePlayerSprite() {
        if (!this.player || !this.playerSpriteBase) return;

        let frameName = this.playerSpriteBase;
        if (this.playerDirection === 'left') {
            frameName = `${this.playerSpriteBase}-left`;
        } else if (this.playerDirection === 'right') {
            frameName = `${this.playerSpriteBase}-right`;
        } else if (this.playerDirection === 'up') {
            frameName = `${this.playerSpriteBase}-up`;
        }
        // 'down' uses the base sprite name (front-facing)

        this.player.setFrame(frameName);
    }

    /**
     * Updates heart and mana display based on current HP/MP
     */
    updateHearts() {
        const hp = NetworkManager.getHP();
        const maxHp = NetworkManager.getMaxHP();
        this.playerHeartDisplay.update(hp, maxHp);

        // Also update mana display
        const mp = NetworkManager.getMP();
        const maxMp = NetworkManager.getMaxMP();
        this.playerManaDisplay.update(mp, maxMp);
    }

    /**
     * Updates gold and level text display
     */
    updateStatsText() {
        const gold = NetworkManager.getGold();
        const level = NetworkManager.getLevel();
        this.goldText.setText(`💰 ${gold}`);
        this.levelText.setText(`⭐ Lv.${level}`);
    }

    /**
     * Opens the menu scene
     */
    openMenu() {
        this.scene.launch('MenuScene', { returnScene: 'DungeonScene', callingScene: this });
        this.scene.pause();
    }

    // ========== TREASURE CHEST SYSTEM ==========

    /**
     * Define what item each floor's chest contains
     */
    getChestContents(floor) {
        const chestLoot = {
            3: { name: 'Mana Potion', itemId: 2, description: 'A shimmering blue potion' },
            5: { name: 'Elixir', itemId: 4, description: 'A powerful healing elixir' }
        };
        return chestLoot[floor] || { name: 'Gold', itemId: null, gold: 50, description: '50 Gold Coins' };
    }

    /**
     * Check if a chest was already opened (persisted in localStorage)
     */
    isChestOpened(floor) {
        const opened = localStorage.getItem(`slime_kingdom_chest_${floor}`);
        return opened === 'true';
    }

    /**
     * Mark a chest as opened
     */
    markChestOpened(floor) {
        localStorage.setItem(`slime_kingdom_chest_${floor}`, 'true');
    }

    /**
     * Open the treasure chest and give player the item
     */
    openChest() {
        if (this.chestOpened || !this.chest) return;

        this.chestOpened = true;
        this.markChestOpened(this.floor);

        // Change chest sprite to open
        this.chest.setFrame('chest-open');

        // Get the loot
        const loot = this.getChestContents(this.floor);

        console.log(`%c[TREASURE CHEST]`, 'color: #ffd700; font-weight: bold');
        console.log(`  Floor ${this.floor}: Found ${loot.name}!`);

        // Pause player movement briefly
        this.isTransitioning = true;

        // Create sparkle effect
        const sparkle = this.add.graphics();
        sparkle.fillStyle(0xffd700, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 20;
            sparkle.fillCircle(
                this.chestPos.x + Math.cos(angle) * dist,
                this.chestPos.y - 10 + Math.sin(angle) * dist,
                3
            );
        }

        // Animate sparkles fading
        this.tweens.add({
            targets: sparkle,
            alpha: 0,
            duration: 800,
            onComplete: () => sparkle.destroy()
        });

        // Show floating text for item obtained
        const itemText = this.add.text(
            this.chestPos.x,
            this.chestPos.y - 30,
            `${loot.name}!`,
            {
                font: 'bold 12px monospace',
                fill: '#ffd700',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: itemText,
            y: itemText.y - 30,
            alpha: 0,
            duration: 1500,
            onComplete: () => itemText.destroy()
        });

        // Update status text with item found
        this.statusText.setText(
            `Found: ${loot.name}!\n\n${loot.description}`
        );

        // Send item to server (if it's an item, not gold)
        if (loot.itemId) {
            // TODO: NetworkManager.sendChestOpened(this.floor, loot.itemId);
            // For now, just log it
            console.log(`  Item ID ${loot.itemId} should be added to inventory`);
        } else if (loot.gold) {
            // TODO: NetworkManager.sendGoldGained(loot.gold);
            console.log(`  ${loot.gold} gold should be added`);
        }

        // Allow movement again after delay
        this.time.delayedCall(1500, () => {
            this.isTransitioning = false;
            this.updateStatusText();
        });
    }
}
