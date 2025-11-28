import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH } from '../constants.js';
import HeartDisplay from '../ui/HeartDisplay.js';
import ManaDisplay from '../ui/ManaDisplay.js';
import MobileControls from '../ui/MobileControls.js';

export default class TownScene extends Phaser.Scene {
    constructor() {
        super('TownScene');
        this.player = null;
        this.cursors = null;
        this.speed = 80;
        this.obstacles = null;

        // Starting position (from server or scene data)
        this.startX = 160;
        this.startY = 160;

        // Player sprite direction
        this.playerSpriteBase = null;
        this.playerDirection = 'down'; // down, up, left, right

        // NPC interaction system
        this.npcs = null;
        this.spaceKey = null;
        this.dialogBox = null;
        this.dialogText = null;
        this.isDialogOpen = false;
        this.nearbyNPC = null;

        // Multiplayer system
        this.otherPlayers = {}; // Store other player sprites by their socket ID
        this.lastSentPosition = { x: 0, y: 0 };
        this.positionUpdateDelay = 100; // Send position updates every 100ms max
        this.lastPositionUpdate = 0;

        // NPC dialog data
        this.npcDialogs = {
            'innkeeper': {
                name: 'Innkeeper',
                message: 'Rest here to restore your hearts! (Press SPACE to heal)'
            },
            'shopkeeper': {
                name: 'Shopkeeper',
                message: 'Welcome to my shop! (Press SPACE to browse)'
            },
            'elder': {
                name: 'Village Elder',
                message: 'Brave adventurer! The Slime Cave to the east holds many dangers... and treasures!'
            },
            'cat': {
                name: 'Cat',
                message: 'Meow! *purrs contentedly*'
            }
        };
    }

    init(data) {
        this.startX = data?.startX || 160;
        this.startY = data?.startY || 160;
        // Reset transition flag (scene instance is reused)
        this.isTransitioning = false;
    }

    create() {
        // Fill background with grass tiles (only in game area)
        for (let x = 0; x < GAME_WIDTH; x += 32) {
            for (let y = 0; y < GAME_HEIGHT; y += 32) {
                this.add.sprite(x + 16, y + 16, 'tiles-town', 'grass');
            }
        }

        // UI panel at bottom
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x1a1a2e, 1);
        uiPanel.fillRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);
        uiPanel.lineStyle(2, 0x4a4a6a, 1);
        uiPanel.strokeRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);

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

        // Add path tiles forming a road through the village
        // Horizontal main road
        for (let x = 0; x < GAME_WIDTH; x += 32) {
            this.add.sprite(x + 16, 160 + 16, 'tiles-town', 'path');
        }
        // Vertical path to cave entrance
        for (let y = 176; y < 256; y += 32) {
            this.add.sprite(280 + 16, y + 16, 'tiles-town', 'path');
        }
        // Small plaza around fountain
        this.add.sprite(144 + 16, 128 + 16, 'tiles-town', 'path');
        this.add.sprite(176 + 16, 128 + 16, 'tiles-town', 'path');
        this.add.sprite(144 + 16, 144 + 16, 'tiles-town', 'path');
        this.add.sprite(176 + 16, 144 + 16, 'tiles-town', 'path');

        // Add water tiles (decorative pond in bottom left corner)
        const waterPositions = [
            { x: 16, y: 256 },
            { x: 48, y: 256 },
        ];
        waterPositions.forEach(pos => {
            this.add.sprite(pos.x + 16, pos.y + 16, 'tiles-town', 'water');
        });

        // Create static physics group for all obstacles
        this.obstacles = this.physics.add.staticGroup();

        // Add buildings with physics bodies (96x96 sprites)
        const inn = this.obstacles.create(70, 60, 'tiles-town', 'building-inn');
        inn.body.setSize(80, 60).setOffset(8, 30);
        inn.refreshBody();

        const shop = this.obstacles.create(250, 60, 'tiles-town', 'building-shop');
        shop.body.setSize(80, 60).setOffset(8, 30);
        shop.refreshBody();

        // Add fountain in center (replaces well)
        const fountain = this.obstacles.create(160, 140, 'tiles-town', 'fountain');
        fountain.body.setSize(48, 48).setOffset(8, 8);
        fountain.refreshBody();

        // Add sign post near cave
        const signPost = this.obstacles.create(260, 248, 'tiles-town', 'sign-post');
        signPost.body.setSize(20, 20).setOffset(6, 6);
        signPost.refreshBody();

        // Add lanterns near buildings
        const lantern1 = this.obstacles.create(32, 115, 'tiles-town', 'lantern');
        lantern1.body.setSize(16, 16).setOffset(8, 8);
        lantern1.refreshBody();

        const lantern2 = this.obstacles.create(288, 115, 'tiles-town', 'lantern');
        lantern2.body.setSize(16, 16).setOffset(8, 8);
        lantern2.refreshBody();

        // Add barrels and crates as obstacles (decorative props)
        const barrel1 = this.obstacles.create(110, 100, 'tiles-town', 'barrel');
        barrel1.body.setSize(24, 24).setOffset(4, 4);
        barrel1.refreshBody();

        const crate1 = this.obstacles.create(210, 100, 'tiles-town', 'crate');
        crate1.body.setSize(24, 24).setOffset(4, 4);
        crate1.refreshBody();

        // Add water tiles as obstacles (pond)
        waterPositions.forEach(pos => {
            const water = this.obstacles.create(pos.x + 16, pos.y + 16, 'tiles-town', 'water');
            water.refreshBody();
        });

        // Add decorative flowers around the village
        this.add.sprite(48, 180, 'tiles-town', 'flowers');
        this.add.sprite(272, 180, 'tiles-town', 'flowers');
        this.add.sprite(120, 240, 'tiles-town', 'flowers');

        // Add cave entrance (leads to dungeon) - bottom right corner
        this.caveEntrance = this.add.sprite(296, 255, 'tiles-town', 'cave-entrance');
        this.caveEntrancePos = { x: 296, y: 255 };
        // Add a label
        this.add.text(296, 220, 'Slime Cave', {
            font: '8px monospace',
            fill: '#666666'
        }).setOrigin(0.5, 0.5);

        // Create NPCs as physics sprites in a group
        // Store them so we can check for nearby NPCs during interactions
        this.npcs = this.physics.add.group();

        // Add innkeeper NPC near the inn (uses npc-innkeeper sprite)
        const innkeeper = this.npcs.create(70, 130, 'npcs', 'npc-innkeeper');
        innkeeper.setImmovable(true);
        innkeeper.body.setSize(24, 24);
        innkeeper.npcType = 'innkeeper';

        // Add shopkeeper NPC near the shop (uses npc-shopkeeper sprite)
        const shopkeeper = this.npcs.create(250, 130, 'npcs', 'npc-shopkeeper');
        shopkeeper.setImmovable(true);
        shopkeeper.body.setSize(24, 24);
        shopkeeper.npcType = 'shopkeeper';

        // Add elder NPC by the fountain (uses npc-elder sprite)
        const elder = this.npcs.create(160, 185, 'npcs', 'npc-elder');
        elder.setImmovable(true);
        elder.body.setSize(24, 24);
        elder.npcType = 'elder';

        // Add cat NPC wandering near flowers (uses npc-cat sprite)
        const cat = this.npcs.create(80, 230, 'npcs', 'npc-cat');
        cat.setImmovable(true);
        cat.body.setSize(16, 16);
        cat.npcType = 'cat';

        // Create player with sprite from server (or default)
        this.playerSpriteBase = NetworkManager.getSprite();
        const startX = this.startX || 160;
        const startY = this.startY || 160;

        this.player = this.physics.add.sprite(startX, startY, 'heroes', this.playerSpriteBase);
        this.player.setScale(0.5);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(32, 32);  // Match tile size for consistent collisions

        // Set up collision between player and all obstacles
        this.physics.add.collider(this.player, this.obstacles);

        // Set up collision between player and NPCs (so player can't walk through them)
        this.physics.add.collider(this.player, this.npcs);

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add Space key for NPC interactions
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Add WASD support
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Add a welcome message
        this.add.text(160, 20, 'Pebble Village', {
            font: '12px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);

        // Create dialog UI elements (hidden initially)
        this.createDialogUI();

        // Mobile controls D-pad at bottom of screen
        this.mobileControls = new MobileControls(this, true);

        // Initialize multiplayer
        this.setupMultiplayer();

        // Fade in when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);

        console.log('Town scene loaded! Use arrow keys to move, SPACE to interact.');
    }

    /**
     * Creates the dialog UI elements
     * Dialog box is positioned in the UI panel below the map
     */
    createDialogUI() {
        // Create a container to hold all dialog elements
        // Dialog is in the UI panel area
        const dialogWidth = 300;
        const dialogHeight = 80;
        const dialogX = 160;  // Center of screen (320/2)
        const dialogY = GAME_HEIGHT + 100;  // In the UI panel area

        // Create semi-transparent background for dialog (overlays the UI)
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x2a2a4e, 0.95);
        this.dialogBox.fillRoundedRect(
            dialogX - dialogWidth / 2,
            dialogY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            8
        );
        this.dialogBox.lineStyle(2, 0x5a5a8e, 1);
        this.dialogBox.strokeRoundedRect(
            dialogX - dialogWidth / 2,
            dialogY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            8
        );
        this.dialogBox.setDepth(100);
        this.dialogBox.setVisible(false);

        // Create text for NPC name (shown at top of dialog box)
        this.dialogName = this.add.text(dialogX, dialogY - 25, '', {
            font: 'bold 12px monospace',
            fill: '#ffdd00',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        this.dialogName.setDepth(101);
        this.dialogName.setVisible(false);

        // Create text for dialog message
        this.dialogText = this.add.text(dialogX, dialogY + 5, '', {
            font: '11px monospace',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: dialogWidth - 30 }
        }).setOrigin(0.5, 0.5);
        this.dialogText.setDepth(101);
        this.dialogText.setVisible(false);

        // Create instruction text for closing dialog
        this.dialogHint = this.add.text(dialogX, dialogY + 30, 'Press SPACE to close', {
            font: '8px monospace',
            fill: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        this.dialogHint.setDepth(101);
        this.dialogHint.setVisible(false);
    }

    /**
     * Shows a dialog box with the NPC's message
     * @param {string} npcType - The type of NPC (innkeeper, shopkeeper, cat)
     */
    showDialog(npcType) {
        const dialogData = this.npcDialogs[npcType];
        if (!dialogData) return;

        // Set dialog content
        this.dialogName.setText(dialogData.name);
        this.dialogText.setText(dialogData.message);

        // Show all dialog elements
        this.dialogBox.setVisible(true);
        this.dialogName.setVisible(true);
        this.dialogText.setVisible(true);
        this.dialogHint.setVisible(true);

        // Mark dialog as open
        this.isDialogOpen = true;

        console.log(`Dialog opened: ${dialogData.name} - ${dialogData.message}`);
    }

    /**
     * Hides the dialog box
     */
    hideDialog() {
        this.dialogBox.setVisible(false);
        this.dialogName.setVisible(false);
        this.dialogText.setVisible(false);
        this.dialogHint.setVisible(false);
        this.isDialogOpen = false;
        this.nearbyNPC = null;

        console.log('Dialog closed');
    }

    /**
     * Checks if player is near any NPC (within 32 pixels)
     * @returns {Object|null} The nearby NPC or null if none found
     */
    checkNearbyNPC() {
        let closestNPC = null;
        let closestDistance = 32;  // Max interaction distance

        this.npcs.getChildren().forEach(npc => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                npc.x,
                npc.y
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestNPC = npc;
            }
        });

        return closestNPC;
    }

    /**
     * Handles NPC interaction when Space key is pressed
     */
    handleInteraction() {
        // If dialog is open, handle special actions then close
        if (this.isDialogOpen) {
            // If talking to innkeeper, heal the player
            if (this.nearbyNPC?.npcType === 'innkeeper') {
                NetworkManager.sendRestAtInn();
                this.showHealEffect();
            }
            // If talking to shopkeeper, open the shop
            if (this.nearbyNPC?.npcType === 'shopkeeper') {
                this.hideDialog();
                this.openShop();
                return;
            }
            this.hideDialog();
            return;
        }

        // Check if player is near any NPC
        const nearbyNPC = this.checkNearbyNPC();
        if (nearbyNPC) {
            this.nearbyNPC = nearbyNPC;
            this.showDialog(nearbyNPC.npcType);
        }
    }

    /**
     * Opens the shop scene
     */
    openShop() {
        this.scene.launch('ShopScene', {
            returnScene: 'TownScene',
            callingScene: this
        });
        this.scene.pause();
    }

    /**
     * Shows a healing effect on the player
     */
    showHealEffect() {
        const heal = this.add.sprite(this.player.x, this.player.y, 'effects', 'fx-heal');
        heal.setScale(1.5);
        heal.setDepth(50);

        this.tweens.add({
            targets: heal,
            y: heal.y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => heal.destroy()
        });

        // Flash player green
        this.tweens.add({
            targets: this.player,
            tint: 0x00ff00,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => this.player.clearTint()
        });
    }

    /**
     * Sets up multiplayer networking
     */
    setupMultiplayer() {
        // Connect to the multiplayer server
        NetworkManager.connect();

        // Handle receiving current players when we join
        NetworkManager.onCurrentPlayers((players) => {
            console.log('Received current players:', players);
            Object.keys(players).forEach(playerId => {
                // Don't create a sprite for ourselves
                if (playerId === NetworkManager.socket?.id) {
                    return;
                }

                // Create sprite for each existing player
                this.addOtherPlayer(players[playerId]);
            });
        });

        // Handle new player joining
        NetworkManager.onPlayerJoin((player) => {
            console.log('Player joined:', player.id);
            this.addOtherPlayer(player);
        });

        // Handle other player movement
        NetworkManager.onPlayerMove((movementData) => {
            const otherPlayer = this.otherPlayers[movementData.id];
            if (otherPlayer) {
                // Smoothly move to new position
                otherPlayer.x = movementData.x;
                otherPlayer.y = movementData.y;
            }
        });

        // Handle player disconnecting
        NetworkManager.onPlayerLeave((playerId) => {
            console.log('Player left:', playerId);
            this.removeOtherPlayer(playerId);
        });
    }

    /**
     * Adds a sprite for another player
     * @param {Object} playerInfo - Player info from server (id, x, y, sprite)
     */
    addOtherPlayer(playerInfo) {
        if (this.otherPlayers[playerInfo.id]) {
            return; // Player already exists
        }

        // Create sprite for other player
        const otherPlayer = this.add.sprite(
            playerInfo.x,
            playerInfo.y,
            'heroes',
            playerInfo.sprite
        );

        // Make other players slightly transparent to distinguish from local player
        otherPlayer.setAlpha(0.8);

        // Store reference
        this.otherPlayers[playerInfo.id] = otherPlayer;

        console.log(`Added player ${playerInfo.id} with sprite ${playerInfo.sprite}`);
    }

    /**
     * Removes a sprite for a disconnected player
     * @param {string} playerId - The socket ID of the player to remove
     */
    removeOtherPlayer(playerId) {
        const otherPlayer = this.otherPlayers[playerId];
        if (otherPlayer) {
            otherPlayer.destroy();
            delete this.otherPlayers[playerId];
        }
    }

    /**
     * Sends player position to server if enough time has passed and position has changed
     */
    sendPlayerPosition() {
        const currentTime = Date.now();

        // Only send updates at the specified interval
        if (currentTime - this.lastPositionUpdate < this.positionUpdateDelay) {
            return;
        }

        // Only send if position has changed significantly (at least 1 pixel)
        const dx = Math.abs(this.player.x - this.lastSentPosition.x);
        const dy = Math.abs(this.player.y - this.lastSentPosition.y);

        if (dx < 1 && dy < 1) {
            return;
        }

        // Send position to server
        NetworkManager.sendPosition(this.player.x, this.player.y);

        // Update tracking variables
        this.lastSentPosition.x = this.player.x;
        this.lastSentPosition.y = this.player.y;
        this.lastPositionUpdate = currentTime;
    }

    update() {
        if (!this.player) return;

        // Handle Space key or mobile action button for NPC interactions
        // Use wasJustPressed (Phaser.Input.Keyboard.JustDown) to prevent multiple triggers
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.mobileControls.consumeAction()) {
            this.handleInteraction();
        }

        // Handle M key for menu
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.openMenu();
        }

        // Don't allow movement while dialog is open
        if (this.isDialogOpen) {
            this.player.setVelocity(0);
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

        // Send player position to server for multiplayer
        this.sendPlayerPosition();

        // Check if player entered the cave
        this.checkCaveEntrance();
    }

    /**
     * Checks if player has walked into the cave entrance
     */
    checkCaveEntrance() {
        if (this.isTransitioning) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.caveEntrancePos.x,
            this.caveEntrancePos.y
        );

        if (dist < 24) {
            this.isTransitioning = true;
            console.log('Entering Slime Cave...');
            // Notify server of scene change
            NetworkManager.sendSceneChange('DungeonScene', 80, 48, 1);
            // Fade out then transition
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('DungeonScene', { floor: 1 });
            });
        }
    }

    updateStatusText() {
        this.statusText.setText(
            `📍 Pebble Village\n` +
            `Arrow keys/WASD to move | SPACE to talk | M for menu`
        );
    }

    updateStatsText() {
        const gold = NetworkManager.getGold();
        const level = NetworkManager.getLevel();
        this.goldText.setText(`💰 ${gold}`);
        this.levelText.setText(`⭐ Lv.${level}`);
    }

    updateHearts() {
        const hp = NetworkManager.getHP();
        const maxHp = NetworkManager.getMaxHP();
        this.playerHeartDisplay.update(hp, maxHp);

        // Also update mana display
        const mp = NetworkManager.getMP();
        const maxMp = NetworkManager.getMaxMP();
        this.playerManaDisplay.update(mp, maxMp);
    }

    openMenu() {
        // Launch the menu scene as an overlay
        this.scene.launch('MenuScene', {
            returnScene: 'TownScene',
            callingScene: this
        });
        this.scene.pause();
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
}
