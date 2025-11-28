import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH } from '../constants.js';
import HeartDisplay from '../ui/HeartDisplay.js';
import ManaDisplay from '../ui/ManaDisplay.js';
import { getCombatSpells, calculateSpellPower } from '../data/spells.js';

/**
 * Enemy attack registry - each monster has 2 unique attacks
 * Movement types: straight, zigzag, pause, fake, projectile, hop, swoop, multiHit, dash, tripleShot
 */
const ENEMY_ATTACKS = {
    'slime': [
        { movement: 'straight', speed: 600, blinks: 2, name: 'Bounce' },
        { movement: 'hop', speed: 800, blinks: 2, name: 'Body Slam' }
    ],
    'bat': [
        { movement: 'projectile', speed: 400, blinks: 1, projectiles: 2, name: 'Sonic Burst' },
        { movement: 'swoop', speed: 350, blinks: 1, name: 'Dive Bomb' }
    ],
    'goblin': [
        { movement: 'pause', speed: 500, blinks: 2, name: 'Sneaky Stab' },
        { movement: 'multiHit', speed: 400, blinks: 2, hits: 2, name: 'Double Slash' }
    ],
    'mushroom': [
        { movement: 'fake', speed: 800, blinks: 3, name: 'Trick Tackle' },
        { movement: 'projectile', speed: 600, blinks: 2, projectiles: 1, name: 'Spore Puff' }
    ],
    'skeleton': [
        { movement: 'straight', speed: 450, blinks: 2, name: 'Sword Swing' },
        { movement: 'projectile', speed: 500, blinks: 1, projectiles: 1, name: 'Bone Throw' }
    ],
    'ghost': [
        { movement: 'fake', speed: 400, blinks: 1, name: 'Phase Strike' },
        { movement: 'teleport', speed: 300, blinks: 1, name: 'Boo!' }
    ],
    'orc': [
        { movement: 'pause', speed: 700, blinks: 3, name: 'Heavy Smash' },
        { movement: 'dash', speed: 300, blinks: 1, name: 'Bull Rush' }
    ],
    'vampire': [
        { movement: 'zigzag', speed: 300, blinks: 1, name: 'Swift Bite' },
        { movement: 'tripleShot', speed: 400, blinks: 1, name: 'Bat Swarm' }
    ],
    'slime-king': [
        { movement: 'straight', speed: 400, blinks: 1, name: 'Royal Crush' },
        { movement: 'tripleShot', speed: 500, blinks: 2, name: 'Slime Burst' }
    ]
};

export default class CombatScene extends Phaser.Scene {
    constructor() {
        super('CombatScene');

        // Combat state
        this.playerHealth = 10;
        this.playerMaxHealth = 10;
        this.playerMana = 10;
        this.playerMaxMana = 10;
        this.enemyHealth = 2;
        this.enemyMaxHealth = 2;
        this.currentAction = 0; // Which action button is selected (0-5)
        this.isPlayerTurn = true;
        this.isProcessingAction = false;

        // Action Points system
        this.actionPoints = 1;    // Current AP
        this.maxActionPoints = 5; // Max AP per turn
        this.isGuarding = false;  // True if Guard is active
        this.guardDefenseBonus = 0; // Defense bonus from Guard

        // Parry system
        this.parryWindowActive = false;
        this.parrySuccessful = false;
        this.parryLockedOut = false; // True if player pressed parry too early
        this.enemyAttackInProgress = false; // True when enemy is attacking
        this.parryText = null;
        this.enterKey = null;

        // Sub-menu system
        this.inSubMenu = false;
        this.subMenuType = null; // 'magic' or 'item'
        this.subMenuItems = [];
        this.subMenuSelection = 0;
        this.subMenuButtons = [];
        this.subMenuBox = null;

        // Sprites and UI elements
        this.playerSprite = null;
        this.enemySprite = null;
        this.actionButtons = [];
        this.cursor = null;
        this.playerHearts = [];
        this.enemyNameText = null;
        this.messageText = null;

        // Combat data
        this.enemyType = 'slime';
        this.returnScene = 'TownScene';
        this.dungeonFloor = 1;
    }

    init(data) {
        // Store enemy data from server
        this.enemyData = data.enemyData || {
            name: 'slime',
            displayName: 'Bouncy Slime',
            sprite: 'slime',
            hp: 6,
            attack: 2,
            defense: 0,
            xpReward: 10,
            goldReward: 5,
            attackPattern: 'straight',
            approachSpeed: 600,
            telegraphBlinks: 2
        };

        this.enemyType = this.enemyData.name;
        this.returnScene = data.returnScene || 'TownScene';
        this.returnData = data.returnData || {};
        this.dungeonFloor = data.returnData?.floor || 1;

        // Get player HP - prefer passed values, fall back to NetworkManager
        const passedHP = data.playerHP;
        const passedMaxHP = data.playerMaxHP;
        const serverHP = NetworkManager.getHP();
        const serverMaxHP = NetworkManager.getMaxHP();
        const serverMP = NetworkManager.getMP();
        const serverMaxMP = NetworkManager.getMaxMP();

        console.log('CombatScene init - Enemy:', this.enemyData.displayName, 'HP:', this.enemyData.hp);
        console.log('CombatScene init - Player HP:', passedHP, 'Server HP:', serverHP, 'MP:', serverMP);

        // Use passed values first (more reliable), then server, then defaults
        this.playerHealth = passedHP ?? serverHP ?? 10;
        this.playerMaxHealth = passedMaxHP ?? serverMaxHP ?? 10;
        this.playerMana = serverMP ?? 10;
        this.playerMaxMana = serverMaxMP ?? 10;

        // Reset parry state
        this.parryWindowActive = false;
        this.parrySuccessful = false;

        // Enemy HP from server data
        this.enemyHealth = this.enemyData.hp;
        this.enemyMaxHealth = this.enemyData.hp;
        this.enemyAttack = this.enemyData.attack;
        this.enemyDefense = this.enemyData.defense || 0;

        // Player combat stats (from NetworkManager - includes equipment bonuses)
        this.playerAttack = NetworkManager.getAttack() || 1;
        this.playerDefense = NetworkManager.getDefense() || 0;

        this.currentAction = 0;
        this.isPlayerTurn = true;
        this.isProcessingAction = false;

        // Reset Action Points system
        this.actionPoints = 1;
        this.isGuarding = false;
        this.guardDefenseBonus = 0;

        // Combat start log
        console.log('%c=== COMBAT START ===', 'color: #ff8800; font-weight: bold');
        console.log(`%cEnemy: ${this.enemyData.displayName}`, 'color: #ff4444');
        console.log(`  HP: ${this.enemyHealth}/${this.enemyMaxHealth}`);
        console.log(`  ATK: ${this.enemyAttack} | DEF: ${this.enemyDefense}`);
        console.log(`%cPlayer:`, 'color: #44ff44');
        console.log(`  HP: ${this.playerHealth}/${this.playerMaxHealth}`);
        console.log(`  ATK: ${this.playerAttack} | DEF: ${this.playerDefense}`);
    }

    create() {
        // Solid background
        this.cameras.main.setBackgroundColor('#1a3a1a');

        // Battle arena area (fills the game area)
        const bg = this.add.graphics();
        bg.fillStyle(0x2a5c2a, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - 60);

        // Ground
        bg.fillStyle(0x4a7c4a, 1);
        bg.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);

        // UI panel at bottom (new 200px area)
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);
        bg.lineStyle(2, 0x4a4a6a, 1);
        bg.strokeRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);

        // Create player hero on the left (centered in battle area) - ready stance
        this.playerSprite = this.add.sprite(50, 180, 'heroes', 'knight-right-ready');
        this.playerSprite.setScale(1.5);

        // Create enemy monster on the right
        this.enemySprite = this.add.sprite(250, 140, 'monsters', this.enemyType);
        this.enemySprite.setScale(1.25);

        // Enemy name label (color changes based on HP)
        const enemyName = this.enemyData.displayName;
        this.enemyNameText = this.add.text(250, 70, enemyName, {
            font: '12px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);

        // Player health display (top left)
        this.add.text(10, 10, 'HERO', {
            font: 'bold 10px monospace',
            fill: '#44ff44'
        });
        // 5 hearts using shared HeartDisplay component
        this.playerHeartDisplay = new HeartDisplay(this, 20, 30, 20, 0.9);

        // Mana display (below hearts)
        this.playerManaDisplay = new ManaDisplay(this, 20, 52, 20, 0.7);

        // Action Points display (thin bars below mana)
        this.apBars = [];
        this.apBarGraphics = this.add.graphics();
        this.createAPDisplay();

        // Add Enter key for parry AND confirming actions
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', () => {
            if (this.enemyAttackInProgress) {
                // Enemy is attacking - handle parry timing
                if (this.parryLockedOut) {
                    // Already pressed too early, ignore further presses
                    return;
                } else if (this.parryWindowActive && !this.parrySuccessful) {
                    // Perfect timing! Parry succeeds
                    this.parrySuccessful = true;
                    this.showParrySuccess();
                } else if (!this.parryWindowActive) {
                    // Pressed too early! Lock out this attack
                    this.parryLockedOut = true;
                    this.showEarlyParry();
                }
            } else {
                // Not in enemy attack - use Enter to confirm action
                this.confirmAction();
            }
        });

        // Set initial heart display based on current HP
        this.updateHearts();

        // Message text (in UI panel)
        this.messageText = this.add.text(160, GAME_HEIGHT + 40, 'Your turn! Choose an action.', {
            font: '14px monospace',
            fill: '#ffffff',
            wordWrap: { width: 300 }
        }).setOrigin(0.5, 0.5);

        // Action buttons - in the UI panel (3x2 grid)
        const actions = [
            { name: 'Attack', icon: '⚔️' },
            { name: 'Magic', icon: '✨' },
            { name: 'Item', icon: '🎒' },
            { name: 'Guard', icon: '🛡️' },
            { name: 'End Turn', icon: '⏭️' },
            { name: 'Flee', icon: '🏃' }
        ];
        const gridStartX = 60;
        const gridStartY = GAME_HEIGHT + 120;
        const colSpacing = 100;
        const rowSpacing = 40;

        // Selection highlight box
        this.selectionBox = this.add.graphics();

        this.actionButtons = [];
        actions.forEach((action, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = gridStartX + (col * colSpacing);
            const y = gridStartY + (row * rowSpacing);

            const label = this.add.text(x, y, `${action.icon} ${action.name}`, {
                font: '11px monospace',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);

            // Make buttons clickable
            label.setInteractive({ useHandCursor: true });
            label.on('pointerdown', () => {
                if (!this.isProcessingAction && this.isPlayerTurn && !this.inSubMenu) {
                    this.currentAction = index;
                    this.updateSelectionBox();
                    this.confirmAction();
                }
            });

            this.actionButtons.push({ label, action: action.name });
        });

        // Draw initial selection
        this.updateSelectionBox();

        // Set up keyboard controls (2D grid navigation)
        this.input.keyboard.on('keydown-LEFT', () => this.moveSelectionHorizontal(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.moveSelectionHorizontal(1));
        this.input.keyboard.on('keydown-UP', () => this.moveSelectionVertical(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelectionVertical(1));
        this.input.keyboard.on('keydown-A', () => this.moveSelectionHorizontal(-1));
        this.input.keyboard.on('keydown-D', () => this.moveSelectionHorizontal(1));
        this.input.keyboard.on('keydown-W', () => this.moveSelectionVertical(-1));
        this.input.keyboard.on('keydown-S', () => this.moveSelectionVertical(1));
        this.input.keyboard.on('keydown-SPACE', () => this.confirmAction());
        this.input.keyboard.on('keydown-ESC', () => this.handleBack());

        // Create the big PARRY button (hidden initially, shown during enemy attacks)
        this.createParryButton();

        // Fade in when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);

        console.log(`Combat started! Fighting: ${enemyName}`);
    }

    updateSelectionBox() {
        const gridStartX = 60;
        const gridStartY = GAME_HEIGHT + 120;
        const colSpacing = 100;
        const rowSpacing = 40;

        const col = this.currentAction % 3;
        const row = Math.floor(this.currentAction / 3);
        const x = gridStartX + (col * colSpacing);
        const y = gridStartY + (row * rowSpacing);

        this.selectionBox.clear();
        this.selectionBox.lineStyle(2, 0xffff00, 1);
        this.selectionBox.strokeRoundedRect(x - 45, y - 14, 90, 28, 4);
    }

    /**
     * Create the big PARRY button for mobile (hidden until enemy attacks)
     */
    createParryButton() {
        const btnWidth = 280;
        const btnHeight = 70;
        const btnX = (GAME_WIDTH - btnWidth) / 2;
        const btnY = GAME_HEIGHT + 100;

        // Background
        this.parryButtonBg = this.add.graphics();
        this.parryButtonBg.fillStyle(0x00aaaa, 1);
        this.parryButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
        this.parryButtonBg.lineStyle(4, 0x00ffff, 1);
        this.parryButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
        this.parryButtonBg.setDepth(300);
        this.parryButtonBg.setVisible(false);

        // Label
        this.parryButtonText = this.add.text(GAME_WIDTH / 2, btnY + btnHeight / 2, 'PARRY!', {
            font: 'bold 28px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5);
        this.parryButtonText.setDepth(301);
        this.parryButtonText.setVisible(false);

        // Interactive zone
        this.parryButtonZone = this.add.rectangle(
            GAME_WIDTH / 2,
            btnY + btnHeight / 2,
            btnWidth + 20,
            btnHeight + 20
        );
        this.parryButtonZone.setInteractive();
        this.parryButtonZone.setDepth(302);
        this.parryButtonZone.setAlpha(0.001);
        this.parryButtonZone.setVisible(false);

        // Handle tap - same logic as ENTER key
        this.parryButtonZone.on('pointerdown', () => {
            if (this.enemyAttackInProgress) {
                if (this.parryLockedOut) {
                    return;
                } else if (this.parryWindowActive && !this.parrySuccessful) {
                    this.parrySuccessful = true;
                    this.showParrySuccess();
                    // Visual feedback on button
                    this.parryButtonBg.clear();
                    this.parryButtonBg.fillStyle(0x00ff00, 1);
                    this.parryButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
                    this.parryButtonBg.lineStyle(4, 0x88ff88, 1);
                    this.parryButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
                    this.parryButtonText.setColor('#88ff88');
                } else if (!this.parryWindowActive) {
                    this.parryLockedOut = true;
                    this.showEarlyParry();
                    // Visual feedback - button turns red
                    this.parryButtonBg.clear();
                    this.parryButtonBg.fillStyle(0xaa0000, 1);
                    this.parryButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
                    this.parryButtonBg.lineStyle(4, 0xff4444, 1);
                    this.parryButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
                    this.parryButtonText.setText('TOO EARLY!');
                    this.parryButtonText.setColor('#ff4444');
                }
            }
        });
    }

    /**
     * Show the big PARRY button and hide action buttons (called when enemy starts attacking)
     */
    showParryButton() {
        const btnWidth = 280;
        const btnHeight = 70;
        const btnX = (GAME_WIDTH - btnWidth) / 2;
        const btnY = GAME_HEIGHT + 100;

        // Reset button appearance
        this.parryButtonBg.clear();
        this.parryButtonBg.fillStyle(0x00aaaa, 1);
        this.parryButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
        this.parryButtonBg.lineStyle(4, 0x00ffff, 1);
        this.parryButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 12);
        this.parryButtonText.setText('PARRY!');
        this.parryButtonText.setColor('#ffffff');

        // Show parry button
        this.parryButtonBg.setVisible(true);
        this.parryButtonText.setVisible(true);
        this.parryButtonZone.setVisible(true);

        // Hide action buttons and selection box
        this.actionButtons.forEach(btn => btn.label.setVisible(false));
        this.selectionBox.setVisible(false);
    }

    /**
     * Hide the PARRY button and restore action buttons (called when enemy turn ends)
     */
    hideParryButton() {
        // Hide parry button
        this.parryButtonBg.setVisible(false);
        this.parryButtonText.setVisible(false);
        this.parryButtonZone.setVisible(false);

        // Show action buttons and selection box
        this.actionButtons.forEach(btn => btn.label.setVisible(true));
        this.selectionBox.setVisible(true);
    }

    moveSelectionHorizontal(direction) {
        // Don't allow selection change during action processing
        if (this.isProcessingAction || !this.isPlayerTurn) return;

        if (this.inSubMenu) {
            // Sub-menu uses vertical only
            return;
        }

        // 3x2 grid: wrap within row
        const col = this.currentAction % 3;
        const row = Math.floor(this.currentAction / 3);
        const newCol = (col + direction + 3) % 3;
        this.currentAction = row * 3 + newCol;
        this.updateSelectionBox();
    }

    moveSelectionVertical(direction) {
        // Don't allow selection change during action processing
        if (this.isProcessingAction || !this.isPlayerTurn) return;

        if (this.inSubMenu) {
            // Navigate sub-menu (up/down style)
            this.subMenuSelection += direction;
            const max = this.subMenuItems.length;
            if (this.subMenuSelection < 0) this.subMenuSelection = max - 1;
            if (this.subMenuSelection >= max) this.subMenuSelection = 0;
            this.updateSubMenuSelection();
            return;
        }

        // 3x2 grid: toggle between top and bottom row
        const col = this.currentAction % 3;
        const row = Math.floor(this.currentAction / 3);
        const newRow = (row + direction + 2) % 2;
        this.currentAction = newRow * 3 + col;
        this.updateSelectionBox();
    }

    handleBack() {
        if (this.inSubMenu) {
            this.closeSubMenu();
        }
    }

    confirmAction() {
        // Don't allow action if already processing or not player's turn
        if (this.isProcessingAction || !this.isPlayerTurn) return;

        if (this.inSubMenu) {
            // Confirm sub-menu selection
            if (this.subMenuSelection === this.subMenuItems.length - 1) {
                // "Back" selected
                this.closeSubMenu();
            } else {
                this.executeSubMenuAction();
            }
            return;
        }

        const actionName = this.actionButtons[this.currentAction].action;

        // Check if player has enough AP (End Turn doesn't require AP)
        if (actionName !== 'End Turn' && this.actionPoints < 1) {
            this.messageText.setText('No action points left!');
            this.time.delayedCall(800, () => {
                this.messageText.setText('Use End Turn or wait.');
            });
            return;
        }

        // Execute the selected action
        switch (actionName) {
            case 'Attack':
                this.isProcessingAction = true;
                this.spendAP(1);
                this.executeAttack();
                break;
            case 'Magic':
                this.openMagicMenu();
                break;
            case 'Item':
                this.openItemMenu();
                break;
            case 'Guard':
                this.isProcessingAction = true;
                this.executeGuard();
                break;
            case 'End Turn':
                this.isProcessingAction = true;
                this.executeEndTurn();
                break;
            case 'Flee':
                this.isProcessingAction = true;
                this.spendAP(1);
                this.executeFlee();
                break;
        }
    }

    // ========== ACTION POINTS SYSTEM ==========

    createAPDisplay() {
        this.updateAPDisplay();
    }

    updateAPDisplay() {
        this.apBarGraphics.clear();
        const startX = 20;
        const startY = 70;
        const barWidth = 18;
        const barHeight = 6;
        const spacing = 4;

        // Draw AP label
        if (!this.apLabel) {
            this.apLabel = this.add.text(startX, startY - 12, 'AP', {
                font: 'bold 8px monospace',
                fill: '#ffcc00'
            });
        }

        for (let i = 0; i < this.maxActionPoints; i++) {
            const x = startX + (i * (barWidth + spacing));

            // Draw bar background (empty)
            this.apBarGraphics.fillStyle(0x333333, 1);
            this.apBarGraphics.fillRect(x, startY, barWidth, barHeight);

            // Draw bar fill if we have this AP
            if (i < this.actionPoints) {
                this.apBarGraphics.fillStyle(0xffcc00, 1);
                this.apBarGraphics.fillRect(x + 1, startY + 1, barWidth - 2, barHeight - 2);
            }

            // Draw border
            this.apBarGraphics.lineStyle(1, 0x666666, 1);
            this.apBarGraphics.strokeRect(x, startY, barWidth, barHeight);
        }
    }

    spendAP(amount) {
        this.actionPoints = Math.max(0, this.actionPoints - amount);
        this.updateAPDisplay();
        console.log(`%c[AP SPENT] -${amount} AP`, 'color: #ffcc00');
        console.log(`  Remaining AP: ${this.actionPoints}/${this.maxActionPoints}`);
    }

    gainAP(amount) {
        const oldAP = this.actionPoints;
        this.actionPoints = Math.min(this.maxActionPoints, this.actionPoints + amount);
        const actualGain = this.actionPoints - oldAP;
        if (actualGain > 0) {
            this.updateAPDisplay();
            console.log(`%c[AP GAINED] +${actualGain} AP`, 'color: #00ff00');
            console.log(`  AP: ${this.actionPoints}/${this.maxActionPoints}`);

            // Show floating AP gain
            const apText = this.add.text(
                this.playerSprite.x + 30,
                this.playerSprite.y - 50,
                `+${actualGain} AP`,
                {
                    font: 'bold 12px monospace',
                    fill: '#ffcc00',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5, 0.5);

            this.tweens.add({
                targets: apText,
                y: apText.y - 20,
                alpha: 0,
                duration: 800,
                onComplete: () => apText.destroy()
            });
        }
    }

    executeGuard() {
        // Guard uses ALL remaining AP and doubles defense for the next enemy attack
        const apUsed = this.actionPoints;
        this.spendAP(this.actionPoints); // Spend all AP

        this.isGuarding = true;
        this.guardDefenseBonus = this.playerDefense; // Double defense

        this.messageText.setText(`Guard! DEF doubled (${this.playerDefense} → ${this.playerDefense + this.guardDefenseBonus})`);

        console.log('%c[GUARD]', 'color: #4488ff; font-weight: bold');
        console.log(`  AP spent: ${apUsed}`);
        console.log(`  Defense: ${this.playerDefense} + ${this.guardDefenseBonus} = ${this.playerDefense + this.guardDefenseBonus}`);

        // Show guard sprite/animation
        this.playerSprite.setFrame('knight-right-parry');
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x4488ff,
            duration: 200,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.playerSprite.clearTint();
                this.playerSprite.setFrame('knight-right-ready');
                // End turn immediately after guard
                this.time.delayedCall(300, () => {
                    this.enemyTurn();
                });
            }
        });
    }

    executeEndTurn() {
        // End turn without spending remaining AP - they carry over
        this.messageText.setText(`Turn ended. (${this.actionPoints} AP saved)`);

        console.log('%c[END TURN]', 'color: #aaaaaa; font-weight: bold');
        console.log(`  AP carried over: ${this.actionPoints}`);

        this.time.delayedCall(500, () => {
            this.enemyTurn();
        });
    }

    executeAttack() {
        // Calculate damage: player attack - enemy defense (minimum 1)
        const damage = Math.max(1, this.playerAttack - this.enemyDefense);
        this.messageText.setText(`You attack! (${damage} dmg)`);

        console.log('%c[PLAYER ATTACK]', 'color: #44ff44; font-weight: bold');
        console.log(`  Player ATK: ${this.playerAttack} - Enemy DEF: ${this.enemyDefense} = ${damage} damage`);

        // Show attack sprite
        this.playerSprite.setFrame('knight-right-attack');

        // Show slash effect
        const slash = this.add.sprite(
            this.enemySprite.x - 20,
            this.enemySprite.y,
            'effects',
            'fx-slash'
        );
        slash.setScale(1.5);

        // Animate the attack
        this.tweens.add({
            targets: slash,
            angle: 45,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                slash.destroy();
                // Return to ready stance
                this.playerSprite.setFrame('knight-right-ready');
                this.damageEnemy(damage);
            }
        });
    }

    // ========== SUB-MENU SYSTEM ==========

    openMagicMenu() {
        // Get spells player has learned based on level (combat spells only)
        const level = NetworkManager.getLevel();
        const learnedSpells = getCombatSpells(level);

        if (learnedSpells.length === 0) {
            this.messageText.setText('No spells learned yet!');
            this.time.delayedCall(1000, () => {
                this.messageText.setText('Your turn! Choose an action.');
            });
            return;
        }

        this.inSubMenu = true;
        this.subMenuType = 'magic';
        this.subMenuItems = [...learnedSpells, { name: 'Back', isBack: true }];
        this.subMenuSelection = 0;

        this.renderSubMenu('SPELLS');
    }

    openItemMenu() {
        // Get consumables from inventory
        const inventory = NetworkManager.getInventory();
        const items = inventory.filter(item => item.type === 'consumable');

        if (items.length === 0) {
            this.messageText.setText('No items available!');
            this.time.delayedCall(1000, () => {
                this.messageText.setText('Your turn! Choose an action.');
            });
            return;
        }

        this.inSubMenu = true;
        this.subMenuType = 'item';
        this.subMenuItems = [...items, { name: 'Back', isBack: true }];
        this.subMenuSelection = 0;

        this.renderSubMenu('ITEMS');
    }

    renderSubMenu(title) {
        // Hide main selection box
        this.selectionBox.setVisible(false);

        // Create sub-menu background
        this.subMenuBox = this.add.graphics();
        this.subMenuBox.fillStyle(0x1a1a2e, 0.95);
        this.subMenuBox.fillRoundedRect(20, GAME_HEIGHT + 70, 280, 120, 8);
        this.subMenuBox.lineStyle(2, 0x4a4a6a, 1);
        this.subMenuBox.strokeRoundedRect(20, GAME_HEIGHT + 70, 280, 120, 8);

        // Title with MP display for magic menu
        let titleText = title;
        if (title === 'SPELLS') {
            titleText = `${title} (MP: ${this.playerMana}/${this.playerMaxMana})`;
        }
        this.subMenuTitle = this.add.text(160, GAME_HEIGHT + 85, titleText, {
            font: 'bold 12px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Render options
        this.subMenuButtons = [];
        const startY = GAME_HEIGHT + 105;
        const lineHeight = 22;

        this.subMenuItems.forEach((item, index) => {
            let displayName;
            let canAfford = true;

            if (item.isBack) {
                displayName = '← Back';
            } else if (item.mpCost !== undefined) {
                // Spell with MP cost
                canAfford = this.playerMana >= item.mpCost;
                displayName = `${item.name} (${item.mpCost} MP)`;
            } else {
                displayName = `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`;
            }

            const isSelected = index === this.subMenuSelection;
            let color = isSelected ? '#ffff00' : '#ffffff';
            if (!canAfford && !item.isBack) {
                color = '#666666'; // Gray out if can't afford
            }

            const text = this.add.text(50, startY + (index * lineHeight), displayName, {
                font: '11px monospace',
                fill: color
            });

            this.subMenuButtons.push(text);
        });

        this.messageText.setText('Select with ↑↓, SPACE to confirm, ESC to back');
    }

    updateSubMenuSelection() {
        this.subMenuButtons.forEach((text, index) => {
            const item = this.subMenuItems[index];
            const isSelected = index === this.subMenuSelection;

            // Check if spell can be afforded
            let canAfford = true;
            if (item && item.mpCost !== undefined) {
                canAfford = this.playerMana >= item.mpCost;
            }

            if (item && item.isBack) {
                text.setColor(isSelected ? '#ffff00' : '#ffffff');
            } else if (!canAfford) {
                text.setColor('#666666');
            } else {
                text.setColor(isSelected ? '#ffff00' : '#ffffff');
            }
        });
    }

    closeSubMenu() {
        this.inSubMenu = false;
        this.subMenuType = null;
        this.subMenuSelection = 0;

        // Clean up sub-menu elements
        if (this.subMenuBox) {
            this.subMenuBox.destroy();
            this.subMenuBox = null;
        }
        if (this.subMenuTitle) {
            this.subMenuTitle.destroy();
            this.subMenuTitle = null;
        }
        this.subMenuButtons.forEach(btn => btn.destroy());
        this.subMenuButtons = [];
        this.subMenuItems = [];

        // Show main selection again
        this.selectionBox.setVisible(true);
        this.messageText.setText('Your turn! Choose an action.');
    }

    executeSubMenuAction() {
        const selectedItem = this.subMenuItems[this.subMenuSelection];
        this.isProcessingAction = true;
        this.closeSubMenu();

        // Spend 1 AP for magic/item actions
        this.spendAP(1);

        if (this.subMenuType === 'magic' || selectedItem.type === 'spell') {
            this.castSpell(selectedItem);
        } else {
            this.useItem(selectedItem);
        }
    }

    castSpell(spell) {
        // Check if player has enough MP
        if (this.playerMana < spell.mpCost) {
            this.messageText.setText('Not enough MP!');
            this.isProcessingAction = false;
            this.time.delayedCall(800, () => {
                this.messageText.setText('Your turn! Choose an action.');
            });
            return;
        }

        // Consume MP
        this.playerMana -= spell.mpCost;
        NetworkManager.sendCastSpell(spell.id, spell.mpCost);

        this.messageText.setText(`You cast ${spell.name}!`);

        // Show magic casting sprite
        this.playerSprite.setFrame('knight-right-magic');

        // Show sparkle effect
        const sparkle = this.add.sprite(
            this.enemySprite.x,
            this.enemySprite.y,
            'effects',
            'fx-sparkle'
        );
        sparkle.setScale(2);

        // Animate the magic
        this.tweens.add({
            targets: sparkle,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                sparkle.destroy();
                // Return to ready stance
                this.playerSprite.setFrame('knight-right-ready');

                // Calculate spell effect based on spell type
                const magic = NetworkManager.getMagic();

                if (spell.effectType === 'damage') {
                    const damage = calculateSpellPower(spell, magic);
                    this.damageEnemy(damage);
                } else if (spell.effectType === 'heal') {
                    const healAmount = calculateSpellPower(spell, magic);
                    this.healPlayer(healAmount);
                    // After healing, check if player has more AP
                    this.time.delayedCall(400, () => {
                        if (this.actionPoints > 0) {
                            this.isProcessingAction = false;
                            this.messageText.setText(`Your turn! (${this.actionPoints} AP left)`);
                        } else {
                            this.enemyTurn();
                        }
                    });
                }

                // Update mana display
                this.updateHearts();
            }
        });
    }

    useItem(item) {
        this.messageText.setText(`You use ${item.name}!`);

        // Show heal effect on player
        const heal = this.add.sprite(
            this.playerSprite.x,
            this.playerSprite.y,
            'effects',
            'fx-heal'
        );
        heal.setScale(1.5);

        // Animate the heal
        this.tweens.add({
            targets: heal,
            y: heal.y - 20,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                heal.destroy();

                // Healing potions heal 25 HP (capped at max)
                const healAmount = 25;
                this.healPlayer(healAmount);

                // Notify server to consume the item
                NetworkManager.useItem(item.itemId);

                // After healing, check if player has more AP
                this.time.delayedCall(400, () => {
                    if (this.actionPoints > 0) {
                        this.isProcessingAction = false;
                        this.messageText.setText(`Your turn! (${this.actionPoints} AP left)`);
                    } else {
                        this.enemyTurn();
                    }
                });
            }
        });
    }

    executeFlee() {
        // 70% base chance to flee, modified by enemy speed
        const fleeChance = Math.max(0.3, 0.7 - (this.enemyData.speed || 1) * 0.1);
        const escaped = Math.random() < fleeChance;

        if (escaped) {
            this.messageText.setText('You escaped!');
            this.isPlayerTurn = false;

            // Animate player running away
            this.tweens.add({
                targets: this.playerSprite,
                x: -50,
                duration: 500,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    // Send flee result to server (no XP/gold, keep current HP)
                    NetworkManager.sendCombatResult(
                        this.enemyType,
                        'flee',
                        0,
                        0,
                        this.dungeonFloor,
                        this.playerHealth
                    );

                    // Return to previous scene with fade
                    this.time.delayedCall(500, () => {
                        this.cameras.main.fadeOut(300, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start(this.returnScene, this.returnData);
                        });
                    });
                }
            });
        } else {
            this.messageText.setText("Can't escape!");

            // Flash player red briefly to show failed flee
            this.tweens.add({
                targets: this.playerSprite,
                tint: 0xffaaaa,
                duration: 150,
                yoyo: true,
                onComplete: () => {
                    this.playerSprite.clearTint();
                    // Enemy gets a free turn since you wasted yours trying to flee
                    this.time.delayedCall(400, () => {
                        this.enemyTurn();
                    });
                }
            });
        }
    }

    damageEnemy(damage) {
        this.enemyHealth -= damage;
        if (this.enemyHealth < 0) this.enemyHealth = 0;

        console.log(`%c[ENEMY DAMAGED] -${damage} HP`, 'color: #ff4444');
        console.log(`  Enemy HP: ${this.enemyHealth}/${this.enemyMaxHealth}`);

        // Show floating damage number (FF style)
        this.showDamageNumber(this.enemySprite.x, this.enemySprite.y - 20, damage, '#ffffff');

        // Flash enemy red
        this.tweens.add({
            targets: this.enemySprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.enemySprite.clearTint();
            }
        });

        // Update heart display
        this.updateHearts();

        // After player damages enemy, check victory then enemy turn
        this.time.delayedCall(400, () => {
            this.afterPlayerAction();
        });
    }

    damagePlayer(damage) {
        this.playerHealth -= damage;
        if (this.playerHealth < 0) this.playerHealth = 0;

        console.log(`%c[PLAYER DAMAGED] -${damage} HP`, 'color: #ff4444');
        console.log(`  Player HP: ${this.playerHealth}/${this.playerMaxHealth}`);

        // Show floating damage number (FF style)
        this.showDamageNumber(this.playerSprite.x, this.playerSprite.y - 20, damage, '#ff4444');

        // Show hit sprite
        this.playerSprite.setFrame('knight-right-hit');

        // Flash player red
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
                // Return to ready stance
                this.playerSprite.setFrame('knight-right-ready');
            }
        });

        // Update heart display
        this.updateHearts();

        // After enemy damages player, check defeat then player turn
        this.time.delayedCall(400, () => {
            this.afterEnemyAction();
        });
    }

    healPlayer(amount) {
        const oldHp = this.playerHealth;
        this.playerHealth += amount;
        if (this.playerHealth > this.playerMaxHealth) {
            this.playerHealth = this.playerMaxHealth;
        }
        const actualHeal = this.playerHealth - oldHp;

        console.log('%c[HEAL]', 'color: #44ff44; font-weight: bold');
        console.log(`  Healed: +${actualHeal} HP`);
        console.log(`  Player HP: ${this.playerHealth}/${this.playerMaxHealth}`);

        // Show floating heal number
        this.showHealNumber(this.playerSprite.x, this.playerSprite.y - 20, actualHeal);

        // Flash player green
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x00ff00,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
            }
        });

        // Update heart display
        this.updateHearts();
    }

    updateHearts() {
        // Update player hearts using shared HeartDisplay
        this.playerHeartDisplay.update(this.playerHealth, this.playerMaxHealth);

        // Update player mana using shared ManaDisplay
        if (this.playerManaDisplay) {
            this.playerManaDisplay.update(this.playerMana, this.playerMaxMana);
        }

        // Update enemy name color based on HP percentage
        this.updateEnemyNameColor();
    }

    updateEnemyNameColor() {
        if (!this.enemyNameText) return;

        const hpPercent = this.enemyHealth / this.enemyMaxHealth;

        if (hpPercent <= 0.25) {
            // Critical - orange
            this.enemyNameText.setColor('#ff8800');
        } else if (hpPercent <= 0.5) {
            // Near defeat - yellow
            this.enemyNameText.setColor('#ffff00');
        } else {
            // Healthy - white
            this.enemyNameText.setColor('#ffffff');
        }
    }

    checkVictory() {
        // Returns true if combat ended
        if (this.enemyHealth <= 0) {
            // Use rewards from enemy data (server already scales by floor)
            const xpReward = this.enemyData.xpReward || 10;
            const goldReward = this.enemyData.goldReward || 5;

            console.log('%c=== VICTORY! ===', 'color: #44ff44; font-weight: bold; font-size: 14px');
            console.log(`  Defeated: ${this.enemyData.displayName}`);
            console.log(`  Rewards: +${xpReward} XP, +${goldReward} Gold`);
            console.log(`  Player HP remaining: ${this.playerHealth}/${this.playerMaxHealth}`);

            this.messageText.setText(`Victory! +${xpReward}XP +${goldReward}G`);
            this.isPlayerTurn = false;
            this.isProcessingAction = true;

            // Track if we received a level up
            this.pendingLevelUp = null;

            // Listen for level up event from server
            const levelUpHandler = (data) => {
                console.log('Level up received!', data);
                this.pendingLevelUp = data;
            };
            NetworkManager.onLevelUp(levelUpHandler);

            // Send combat result to server
            NetworkManager.sendCombatResult(
                this.enemyType,
                'victory',
                xpReward,
                goldReward,
                this.dungeonFloor,
                this.playerHealth
            );

            this.tweens.add({
                targets: this.enemySprite,
                alpha: 0,
                y: this.enemySprite.y + 20,
                duration: 500
            });

            this.time.delayedCall(2000, () => {
                // Fade out then transition
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // Check if we got a level up
                    if (this.pendingLevelUp) {
                        // Go to level up scene, then return to dungeon
                        this.scene.start('LevelUpScene', {
                            newLevel: this.pendingLevelUp.newLevel,
                            statGains: this.pendingLevelUp.statGains,
                            newStats: this.pendingLevelUp.newStats,
                            returnScene: this.returnScene,
                            returnData: this.returnData
                        });
                    } else {
                        this.scene.start(this.returnScene, this.returnData);
                    }
                });
            });
            return true;
        }
        return false;
    }

    checkDefeat() {
        // Returns true if combat ended
        if (this.playerHealth <= 0) {
            console.log('%c=== DEFEAT! ===', 'color: #ff4444; font-weight: bold; font-size: 14px');
            console.log(`  Defeated by: ${this.enemyData.displayName}`);
            console.log(`  Enemy HP remaining: ${this.enemyHealth}/${this.enemyMaxHealth}`);

            this.messageText.setText('Oh no!');
            this.isPlayerTurn = false;
            this.isProcessingAction = true;

            // Show KO sprite
            this.playerSprite.setFrame('knight-ko');

            // Send defeat result to server - restore to max HP (bonked = knocked out, not dead)
            NetworkManager.sendCombatResult(
                this.enemyType,
                'defeat',
                0,
                0,
                this.dungeonFloor,
                this.playerMaxHealth // Respawn with full HP
            );

            // Go to Game Over scene with fade
            this.time.delayedCall(1500, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('GameOverScene', {
                        defeatedBy: this.enemyData.displayName,
                        floor: this.dungeonFloor
                    });
                });
            });
            return true;
        }
        return false;
    }

    afterPlayerAction() {
        // Called after player damages enemy
        if (this.checkVictory()) return;

        // Check if player has remaining AP to take more actions
        if (this.actionPoints > 0) {
            // Player can take more actions
            this.isProcessingAction = false;
            this.messageText.setText(`Your turn! (${this.actionPoints} AP left)`);
            console.log('%c[PLAYER TURN CONTINUES]', 'color: #44ff44');
            console.log(`  Remaining AP: ${this.actionPoints}`);
            return;
        }

        // No AP left - enemy's turn
        this.time.delayedCall(600, () => {
            this.enemyTurn();
        });
    }

    afterEnemyAction() {
        // Called after enemy damages player
        this.enemyAttackInProgress = false; // Enemy attack finished
        this.parryWindowActive = false;

        // Hide the PARRY button and restore action buttons
        this.hideParryButton();

        // Reset guard state after enemy attack
        if (this.isGuarding) {
            console.log('%c[GUARD RESET]', 'color: #4488ff');
            console.log('  Defense returned to normal');
            this.isGuarding = false;
            this.guardDefenseBonus = 0;
        }

        if (this.checkDefeat()) return;

        // Back to player's turn
        this.time.delayedCall(600, () => {
            // Give +1 AP at start of player's turn
            this.gainAP(1);

            this.isPlayerTurn = true;
            this.isProcessingAction = false;
            this.messageText.setText(`Your turn! (${this.actionPoints} AP)`);
            this.updateSelectionBox();
        });
    }

    getEnemyAttackPattern() {
        // Get attacks for this enemy type from registry
        const attacks = ENEMY_ATTACKS[this.enemyType];

        let selectedAttack;
        if (attacks && attacks.length > 0) {
            // Randomly pick one of the two attacks
            selectedAttack = attacks[Math.floor(Math.random() * attacks.length)];
        } else {
            // Fallback to server data if enemy not in registry
            selectedAttack = {
                movement: this.enemyData.attackPattern || 'straight',
                speed: this.enemyData.approachSpeed || 600,
                blinks: this.enemyData.telegraphBlinks || 2,
                name: 'Attack'
            };
        }

        const telegraphBlinks = selectedAttack.blinks || 2;

        // Calculate damage: enemy attack - player defense (including guard bonus) (minimum 1)
        const rawDamage = this.enemyAttack || 2;
        const totalDefense = this.playerDefense + this.guardDefenseBonus;
        const finalDamage = Math.max(1, rawDamage - totalDefense);

        return {
            approachSpeed: selectedAttack.speed || 600,
            telegraphBlinks: telegraphBlinks,
            telegraphSpeed: Math.max(80, 200 - (telegraphBlinks * 30)),
            movement: selectedAttack.movement || 'straight',
            damage: finalDamage,
            attackName: selectedAttack.name || 'Attack',
            projectiles: selectedAttack.projectiles || 1,
            hits: selectedAttack.hits || 1
        };
    }

    enemyTurn() {
        this.isPlayerTurn = false;
        this.parrySuccessful = false;
        this.parryLockedOut = false; // Reset lockout for new attack
        this.enemyAttackInProgress = true; // Enemy is now attacking
        const enemyName = this.enemyData.displayName || 'Monster';
        const pattern = this.getEnemyAttackPattern();

        // Show the big PARRY button for mobile
        this.showParryButton();

        console.log('%c[ENEMY TURN]', 'color: #ff4444; font-weight: bold');
        console.log(`  ${enemyName} uses: ${pattern.attackName}`);
        const totalDef = this.playerDefense + this.guardDefenseBonus;
        console.log(`  Enemy ATK: ${this.enemyAttack} - Player DEF: ${totalDef}${this.isGuarding ? ' (GUARDING!)' : ''} = ${pattern.damage} damage`);
        console.log(`  Pattern: ${pattern.movement} | Speed: ${pattern.approachSpeed}ms`);

        this.messageText.setText(`${enemyName}: ${pattern.attackName}!`);

        // Store original position
        const originalX = this.enemySprite.x;
        const originalY = this.enemySprite.y;
        const targetX = this.playerSprite.x + 40; // Stop just before player

        // Phase 1: Telegraph with blinking
        this.tweens.add({
            targets: this.enemySprite,
            alpha: 0.3,
            duration: pattern.telegraphSpeed,
            yoyo: true,
            repeat: (pattern.telegraphBlinks * 2) - 1,
            onComplete: () => {
                this.messageText.setText(`${enemyName} attacks!`);

                // Phase 2: Enemy moves toward player based on movement pattern
                this.executeEnemyMovement(pattern, originalX, originalY, targetX, enemyName);
            }
        });
    }

    executeEnemyMovement(pattern, originalX, originalY, targetX, enemyName) {
        switch (pattern.movement) {
            case 'projectile':
                // Shoots energy balls at player
                this.executeProjectileAttack(pattern, originalX, originalY, enemyName);
                break;

            case 'tripleShot':
                // Shoots 3 projectiles in a spread pattern
                this.executeTripleShotAttack(pattern, originalX, originalY, enemyName);
                break;

            case 'zigzag':
                // Wavy approach pattern
                this.tweens.add({
                    targets: this.enemySprite,
                    x: targetX,
                    y: { value: originalY + 30, duration: pattern.approachSpeed / 3, yoyo: true, repeat: 1 },
                    duration: pattern.approachSpeed,
                    ease: 'Sine.easeIn',
                    onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName)
                });
                break;

            case 'hop':
                // Slime body slam - jumps up high then slams down on player
                this.tweens.add({
                    targets: this.enemySprite,
                    y: originalY - 80, // Jump up high
                    duration: pattern.approachSpeed * 0.4,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Hang in air briefly
                        this.time.delayedCall(200, () => {
                            // Start parry window as slam begins
                            this.parryWindowActive = true;
                            this.messageText.setText('PARRY! [ENTER]');
                            this.tweens.add({
                                targets: this.messageText,
                                alpha: 0.3,
                                duration: 50,
                                yoyo: true,
                                repeat: 2
                            });

                            // Slam down onto player position
                            this.tweens.add({
                                targets: this.enemySprite,
                                x: targetX,
                                y: originalY + 10, // Slight squish on landing
                                duration: pattern.approachSpeed * 0.3,
                                ease: 'Quad.easeIn',
                                onComplete: () => {
                                    // Bounce back up slightly
                                    this.tweens.add({
                                        targets: this.enemySprite,
                                        y: originalY,
                                        duration: 100,
                                        onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                                    });
                                }
                            });
                        });
                    }
                });
                break;

            case 'swoop':
                // Bat dive bomb - arcs from above
                const swoopPeakY = originalY - 60;
                this.tweens.add({
                    targets: this.enemySprite,
                    x: (originalX + targetX) / 2,
                    y: swoopPeakY,
                    duration: pattern.approachSpeed * 0.4,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Start parry as dive begins
                        this.time.delayedCall(50, () => {
                            this.parryWindowActive = true;
                            this.messageText.setText('PARRY! [ENTER]');
                            this.tweens.add({
                                targets: this.messageText,
                                alpha: 0.3,
                                duration: 50,
                                yoyo: true,
                                repeat: 2
                            });
                        });

                        // Dive down at player
                        this.tweens.add({
                            targets: this.enemySprite,
                            x: targetX,
                            y: this.playerSprite.y,
                            duration: pattern.approachSpeed * 0.3,
                            ease: 'Quad.easeIn',
                            onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                        });
                    }
                });
                break;

            case 'multiHit':
                // Two quick attacks in succession
                this.executeMultiHitAttack(pattern, originalX, originalY, targetX, enemyName);
                break;

            case 'dash':
                // Very fast charge with minimal telegraph
                this.time.delayedCall(pattern.approachSpeed * 0.5, () => {
                    this.parryWindowActive = true;
                    this.messageText.setText('PARRY! [ENTER]');
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: 0.3,
                        duration: 30,
                        yoyo: true,
                        repeat: 1
                    });
                });

                // Brief windup shake
                this.tweens.add({
                    targets: this.enemySprite,
                    x: originalX + 5,
                    duration: 50,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        // FAST dash!
                        this.tweens.add({
                            targets: this.enemySprite,
                            x: targetX,
                            duration: pattern.approachSpeed * 0.4,
                            ease: 'Cubic.easeIn',
                            onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                        });
                    }
                });
                break;

            case 'teleport':
                // Ghost blink - disappear and reappear close to player
                this.tweens.add({
                    targets: this.enemySprite,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        // Teleport to just in front of player
                        this.enemySprite.x = targetX + 30;
                        this.enemySprite.y = this.playerSprite.y;

                        // Reappear with parry window
                        this.parryWindowActive = true;
                        this.messageText.setText('PARRY! [ENTER]');

                        this.tweens.add({
                            targets: this.enemySprite,
                            alpha: 1,
                            duration: 150,
                            onComplete: () => {
                                // Quick strike after reappearing
                                this.tweens.add({
                                    targets: this.enemySprite,
                                    x: targetX,
                                    duration: pattern.approachSpeed * 0.3,
                                    ease: 'Quad.easeIn',
                                    onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                                });
                            }
                        });
                    }
                });
                break;

            case 'pause':
                // Charges halfway, pauses menacingly, then strikes
                this.tweens.add({
                    targets: this.enemySprite,
                    x: (originalX + targetX) / 2,
                    duration: pattern.approachSpeed * 0.3,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Pause and shake menacingly
                        this.tweens.add({
                            targets: this.enemySprite,
                            x: this.enemySprite.x + 5,
                            duration: 50,
                            yoyo: true,
                            repeat: 3,
                            onComplete: () => {
                                // Start parry early during final strike
                                this.time.delayedCall(pattern.approachSpeed * 0.15, () => {
                                    this.parryWindowActive = true;
                                    this.messageText.setText('PARRY! [ENTER]');
                                    this.tweens.add({
                                        targets: this.messageText,
                                        alpha: 0.3,
                                        duration: 50,
                                        yoyo: true,
                                        repeat: 2
                                    });
                                });

                                // Then strike!
                                this.tweens.add({
                                    targets: this.enemySprite,
                                    x: targetX,
                                    duration: pattern.approachSpeed * 0.3,
                                    ease: 'Quad.easeIn',
                                    onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                                });
                            }
                        });
                    }
                });
                break;

            case 'fake':
                // Fake-out then real attack
                this.tweens.add({
                    targets: this.enemySprite,
                    x: originalX - 20, // Move BACK first (fake)
                    duration: pattern.approachSpeed * 0.3,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.time.delayedCall(200, () => {
                            // Start parry early during real attack
                            this.time.delayedCall(pattern.approachSpeed * 0.3, () => {
                                this.parryWindowActive = true;
                                this.messageText.setText('PARRY! [ENTER]');
                                this.tweens.add({
                                    targets: this.messageText,
                                    alpha: 0.3,
                                    duration: 50,
                                    yoyo: true,
                                    repeat: 2
                                });
                            });

                            // Real attack
                            this.tweens.add({
                                targets: this.enemySprite,
                                x: targetX,
                                duration: pattern.approachSpeed * 0.5,
                                ease: 'Quad.easeIn',
                                onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                            });
                        });
                    }
                });
                break;

            default:
                // Straight: simple direct approach
                this.time.delayedCall(pattern.approachSpeed * 0.75, () => {
                    this.parryWindowActive = true;
                    this.messageText.setText('PARRY! [ENTER]');
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: 0.3,
                        duration: 50,
                        yoyo: true,
                        repeat: 2
                    });
                });

                this.tweens.add({
                    targets: this.enemySprite,
                    x: targetX,
                    duration: pattern.approachSpeed,
                    ease: 'Quad.easeIn',
                    onComplete: () => this.onEnemyReachPlayer(pattern, originalX, originalY, enemyName, true)
                });
                break;
        }
    }

    executeMultiHitAttack(pattern, originalX, originalY, targetX, enemyName) {
        // Two quick slashes
        const hitCount = pattern.hits || 2;
        this.multiHitCount = 0;
        this.multiHitParries = 0;

        const executeHit = (hitNum) => {
            // Quick approach
            this.tweens.add({
                targets: this.enemySprite,
                x: targetX,
                duration: pattern.approachSpeed * 0.3,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    // Parry window for this hit - reset lockout for new parry opportunity
                    this.parryWindowActive = true;
                    this.parrySuccessful = false;
                    this.parryLockedOut = false;
                    this.messageText.setText('PARRY! [ENTER]');

                    this.time.delayedCall(180, () => {
                        this.parryWindowActive = false;

                        if (this.parrySuccessful) {
                            this.multiHitParries++;
                            this.showParrySuccess();
                        } else {
                            // Hit connects
                            this.multiHitCount++;
                            const hit = this.add.sprite(this.playerSprite.x + 10, this.playerSprite.y, 'effects', 'hit');
                            hit.setScale(1.2);
                            this.tweens.add({
                                targets: hit,
                                alpha: 0,
                                scale: 1.5,
                                duration: 200,
                                onComplete: () => hit.destroy()
                            });
                            this.damagePlayerNoTurnEnd(pattern.damage);
                        }

                        // Return to position
                        this.tweens.add({
                            targets: this.enemySprite,
                            x: originalX,
                            duration: 150,
                            onComplete: () => {
                                if (hitNum < hitCount) {
                                    // Do another hit
                                    this.time.delayedCall(100, () => executeHit(hitNum + 1));
                                } else {
                                    // All hits done
                                    this.tweens.add({
                                        targets: this.enemySprite,
                                        y: originalY,
                                        duration: 200,
                                        onComplete: () => {
                                            if (this.multiHitCount > 0) {
                                                this.messageText.setText(`Hit ${this.multiHitCount} time${this.multiHitCount > 1 ? 's' : ''}!`);
                                            } else {
                                                this.messageText.setText('Blocked all hits!');
                                            }
                                            this.time.delayedCall(300, () => this.afterEnemyAction());
                                        }
                                    });
                                }
                            }
                        });
                    });
                }
            });
        };

        executeHit(1);
    }

    executeTripleShotAttack(pattern, originalX, originalY, enemyName) {
        // Fire 3 projectiles in a spread pattern
        const targetX = this.playerSprite.x + 10;
        const targetY = this.playerSprite.y;
        const flightTime = pattern.approachSpeed;

        this.projectileHits = 0;
        this.projectileParries = 0;
        this.totalProjectiles = 3;
        this.projectilesResolved = 0;

        const offsets = [-25, 0, 25]; // Vertical spread
        const delays = [0, 150, 300]; // Staggered firing

        offsets.forEach((offset, index) => {
            this.time.delayedCall(delays[index], () => {
                const ball = this.add.graphics();
                ball.fillStyle(index === 1 ? 0xff4444 : 0xffaa44, 1);
                ball.fillCircle(0, 0, 6);
                ball.fillStyle(0xffcc88, 0.5);
                ball.fillCircle(0, 0, 9);
                ball.x = originalX - 20;
                ball.y = originalY + offset;

                // Animate ball
                this.tweens.add({
                    targets: ball,
                    x: targetX,
                    y: targetY,
                    duration: flightTime,
                    ease: 'Linear',
                    onComplete: () => this.onTripleShotProjectileImpact(ball, pattern.damage, index + 1)
                });

                // Start parry window near impact - reset lockout for new parry opportunity
                this.time.delayedCall(flightTime * 0.7, () => {
                    this.parryWindowActive = true;
                    this.parrySuccessful = false;
                    this.parryLockedOut = false;
                    this.messageText.setText('PARRY! [ENTER]');
                });
            });
        });
    }

    onTripleShotProjectileImpact(ball, damage, ballNumber) {
        const parryWindow = 150;

        this.time.delayedCall(parryWindow, () => {
            this.parryWindowActive = false;
            ball.destroy();

            if (this.parrySuccessful) {
                this.projectileParries++;
                const deflect = this.add.sprite(this.playerSprite.x, this.playerSprite.y, 'effects', 'sparkle');
                deflect.setScale(0.6);
                this.tweens.add({
                    targets: deflect,
                    alpha: 0,
                    scale: 1,
                    duration: 200,
                    onComplete: () => deflect.destroy()
                });
            } else {
                this.projectileHits++;
                const hit = this.add.sprite(this.playerSprite.x + 5, this.playerSprite.y, 'effects', 'hit');
                hit.setScale(1);
                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 1.3,
                    duration: 200,
                    onComplete: () => hit.destroy()
                });
                this.damagePlayerNoTurnEnd(damage);
            }

            this.projectilesResolved++;

            // After all projectiles resolved
            if (this.projectilesResolved >= this.totalProjectiles) {
                this.time.delayedCall(300, () => {
                    if (this.projectileHits > 0) {
                        this.messageText.setText(`Hit by ${this.projectileHits} projectile${this.projectileHits > 1 ? 's' : ''}!`);
                    } else {
                        this.messageText.setText('Deflected all shots!');
                    }
                    this.time.delayedCall(300, () => this.afterEnemyAction());
                });
            }
        });
    }

    executeProjectileAttack(pattern, originalX, originalY, enemyName) {
        // Shoots energy balls at player (configurable count)
        const numProjectiles = pattern.projectiles || 2;
        const targetX = this.playerSprite.x + 10;
        const targetY = this.playerSprite.y;
        const flightTime = pattern.approachSpeed;
        const ballDelay = 500; // 0.5 second delay between balls

        // Track hits for this attack
        this.projectileHits = 0;
        this.projectileParries = 0;
        this.totalProjectilesInAttack = numProjectiles;
        this.projectilesResolvedInAttack = 0;

        // Fire each projectile with delay
        for (let i = 0; i < numProjectiles; i++) {
            this.time.delayedCall(i * ballDelay, () => {
                // Vary colors slightly for each ball
                const hue = 0x8844ff + (i * 0x110022);
                const ball = this.add.graphics();
                ball.fillStyle(hue, 1);
                ball.fillCircle(0, 0, 8);
                ball.fillStyle(0xcc88ff, 0.5);
                ball.fillCircle(0, 0, 12);
                ball.x = originalX - 20;
                ball.y = originalY;

                // Animate ball
                this.tweens.add({
                    targets: ball,
                    x: targetX,
                    y: targetY,
                    duration: flightTime,
                    ease: 'Quad.easeIn',
                    onComplete: () => this.onSingleProjectileImpact(ball, pattern.damage, i + 1)
                });

                // Start parry window for this ball - reset lockout for new parry opportunity
                this.time.delayedCall(flightTime * 0.7, () => {
                    this.parryWindowActive = true;
                    this.parrySuccessful = false;
                    this.parryLockedOut = false;
                    this.messageText.setText('PARRY! [ENTER]');
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: 0.3,
                        duration: 50,
                        yoyo: true,
                        repeat: 2
                    });
                });
            });
        }
    }

    onSingleProjectileImpact(ball, damage, ballNumber) {
        // Short parry window after ball reaches player
        const parryWindow = 200;

        this.time.delayedCall(parryWindow, () => {
            this.parryWindowActive = false;
            ball.destroy();

            if (this.parrySuccessful) {
                // Parried this ball!
                this.projectileParries++;
                this.messageText.setText('PARRIED!');

                const deflect = this.add.sprite(this.playerSprite.x, this.playerSprite.y, 'effects', 'sparkle');
                deflect.setScale(0.8);
                this.tweens.add({
                    targets: deflect,
                    alpha: 0,
                    scale: 1.2,
                    duration: 300,
                    onComplete: () => deflect.destroy()
                });
            } else {
                // Hit by this ball!
                this.projectileHits++;

                const hit = this.add.sprite(this.playerSprite.x + 10, this.playerSprite.y, 'effects', 'hit');
                hit.setScale(1.5);
                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => hit.destroy()
                });

                // Each ball does full attack damage
                this.damagePlayerNoTurnEnd(damage);
            }

            this.projectilesResolvedInAttack++;

            // After all balls resolved, end the enemy turn
            if (this.projectilesResolvedInAttack >= this.totalProjectilesInAttack) {
                this.time.delayedCall(400, () => {
                    if (this.projectileHits > 0) {
                        this.messageText.setText(`Hit by ${this.projectileHits} ball${this.projectileHits > 1 ? 's' : ''}!`);
                    } else {
                        this.messageText.setText('Deflected all shots!');
                    }
                    this.time.delayedCall(300, () => this.afterEnemyAction());
                });
            }
        });
    }

    damagePlayerNoTurnEnd(damage) {
        // Damage player without triggering turn end (for multi-hit attacks)
        this.playerHealth -= damage;
        if (this.playerHealth < 0) this.playerHealth = 0;

        console.log(`%c[PLAYER DAMAGED] -${damage} HP (multi-hit)`, 'color: #ff4444');
        console.log(`  Player HP: ${this.playerHealth}/${this.playerMaxHealth}`);

        // Show floating damage number (FF style)
        this.showDamageNumber(this.playerSprite.x, this.playerSprite.y - 20, damage, '#ff4444');

        // Show hit sprite
        this.playerSprite.setFrame('knight-right-hit');

        // Flash player red
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.playerSprite.clearTint();
                // Return to ready stance
                this.playerSprite.setFrame('knight-right-ready');
            }
        });

        // Update heart display
        this.updateHearts();
    }

    /**
     * Show floating damage number (Final Fantasy style)
     */
    showDamageNumber(x, y, damage, color = '#ffffff') {
        const dmgText = this.add.text(x, y, `-${damage}`, {
            font: 'bold 16px monospace',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        // Float up and fade out
        this.tweens.add({
            targets: dmgText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => dmgText.destroy()
        });
    }

    /**
     * Show floating heal number (green, positive)
     */
    showHealNumber(x, y, amount) {
        const healText = this.add.text(x, y, `+${amount}`, {
            font: 'bold 16px monospace',
            fill: '#44ff44',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        // Float up and fade out
        this.tweens.add({
            targets: healText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => healText.destroy()
        });
    }

    onEnemyReachPlayer(pattern, originalX, originalY, enemyName, parryAlreadyStarted = false) {
        // Start parry window if not already started early
        if (!parryAlreadyStarted) {
            this.parryWindowActive = true;
            this.messageText.setText('PARRY! [ENTER]');

            // Flash message
            this.tweens.add({
                targets: this.messageText,
                alpha: 0.3,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        }

        // Short parry window (gets shorter with harder enemies)
        // If parry started early, we have less time remaining
        const baseParryWindow = Math.max(150, 300 - (this.dungeonFloor * 20));
        const parryWindow = parryAlreadyStarted ? baseParryWindow * 0.6 : baseParryWindow;

        this.time.delayedCall(parryWindow, () => {
            this.parryWindowActive = false;

            if (this.parrySuccessful) {
                // Parry successful!
                this.messageText.setText('PARRIED!');
                // Enemy bounces back
                this.tweens.add({
                    targets: this.enemySprite,
                    x: originalX + 30,
                    duration: 100,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: this.enemySprite,
                            x: originalX,
                            y: originalY,
                            duration: 300,
                            onComplete: () => {
                                this.time.delayedCall(300, () => this.afterEnemyAction());
                            }
                        });
                    }
                });
            } else {
                // Attack lands!
                const hit = this.add.sprite(
                    this.playerSprite.x + 20,
                    this.playerSprite.y,
                    'effects',
                    'hit'
                );

                this.tweens.add({
                    targets: hit,
                    alpha: 0,
                    scale: 1.5,
                    duration: 300,
                    onComplete: () => hit.destroy()
                });

                // Return enemy to position
                this.tweens.add({
                    targets: this.enemySprite,
                    x: originalX,
                    y: originalY,
                    duration: 400,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.damagePlayer(pattern.damage);
                    }
                });
            }
        });
    }

    showParrySuccess() {
        console.log('%c[PARRY SUCCESS!]', 'color: #00ffff; font-weight: bold');
        console.log('  Attack blocked - no damage taken!');

        // Award +1 AP for successful parry (max 5)
        this.gainAP(1);

        // Visual feedback for successful parry timing
        // Show parry sprite
        this.playerSprite.setFrame('knight-right-parry');

        // Flash player with shield effect
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x00ffff,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
                // Return to ready stance
                this.playerSprite.setFrame('knight-right-ready');
            }
        });

        // Show "PARRY!" text effect
        const parryFx = this.add.text(
            this.playerSprite.x,
            this.playerSprite.y - 30,
            'PARRY!',
            {
                font: 'bold 14px monospace',
                fill: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: parryFx,
            y: parryFx.y - 20,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                parryFx.destroy();
            }
        });
    }

    showEarlyParry() {
        console.log('%c[PARRY TOO EARLY!]', 'color: #ffaa00; font-weight: bold');
        console.log('  Locked out - cannot parry this attack!');

        // Visual feedback for pressing parry too early
        // Flash player red briefly
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff4444,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                this.playerSprite.clearTint();
            }
        });

        // Show "TOO EARLY!" text effect
        const earlyFx = this.add.text(
            this.playerSprite.x,
            this.playerSprite.y - 30,
            'TOO EARLY!',
            {
                font: 'bold 12px monospace',
                fill: '#ff4444',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: earlyFx,
            y: earlyFx.y - 15,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                earlyFx.destroy();
            }
        });
    }

}
