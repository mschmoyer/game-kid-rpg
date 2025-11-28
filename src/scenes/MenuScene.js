import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH, TOTAL_HEIGHT } from '../constants.js';
import { getOutOfCombatSpells, calculateSpellPower, SPELL_DEFINITIONS } from '../data/spells.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.returnScene = null;
        this.callingScene = null;
        this.selectedIndex = 0;
        this.menuItems = [];
        this.currentView = 'main'; // 'main', 'items', 'magic', 'status', 'stats'
        this.subMenuSelection = 0;
    }

    init(data) {
        this.returnScene = data.returnScene || 'TownScene';
        this.callingScene = data.callingScene || null;
        this.selectedIndex = 0;
        this.currentView = 'main';
        this.subMenuSelection = 0;
    }

    create() {
        // Full-height dark background overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0a0a15, 0.95);
        overlay.fillRect(0, 0, GAME_WIDTH, TOTAL_HEIGHT);

        // Decorative border
        const border = this.add.graphics();
        border.lineStyle(3, 0x5a5a8e, 1);
        border.strokeRect(8, 8, GAME_WIDTH - 16, TOTAL_HEIGHT - 16);
        border.lineStyle(1, 0x3a3a5e, 1);
        border.strokeRect(12, 12, GAME_WIDTH - 24, TOTAL_HEIGHT - 24);

        // Container for dynamic content
        this.contentContainer = this.add.container(0, 0);

        // Show main menu
        this.showMainMenu();

        // Input handling
        this.input.keyboard.on('keydown-ESC', () => this.handleBack());
        this.input.keyboard.on('keydown-M', () => {
            if (this.currentView === 'main') {
                this.closeMenu();
            } else {
                this.handleBack();
            }
        });
        this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-W', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-S', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
        this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());

        console.log('Menu opened');
    }

    clearContent() {
        this.contentContainer.removeAll(true);
        this.menuItems = [];
    }

    showMainMenu() {
        this.clearContent();
        this.currentView = 'main';
        this.selectedIndex = 0;

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 30, 'MENU', {
            font: 'bold 18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        // Player info at top
        this.addPlayerHeader();

        // Menu options
        const menuOptions = [
            { name: 'Items', icon: '🎒', desc: 'Use items', action: () => this.showItemsMenu() },
            { name: 'Magic', icon: '✨', desc: 'Cast spells', action: () => this.showMagicMenu() },
            { name: 'Status', icon: '📊', desc: 'View stats', action: () => this.showStatusMenu() },
            { name: 'Stats', icon: '📜', desc: 'Game stats', action: () => this.showStatsMenu() },
            { name: 'Main Menu', icon: '🏠', desc: 'Coming soon', action: () => this.showMessage('Coming soon!') },
            { name: 'Back', icon: '❌', desc: 'Close menu', action: () => this.closeMenu() }
        ];

        const startY = 170;
        const lineHeight = 50;

        menuOptions.forEach((option, index) => {
            const y = startY + (index * lineHeight);

            // Option background
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a2e, 1);
            bg.fillRoundedRect(30, y - 18, GAME_WIDTH - 60, 40, 6);
            this.contentContainer.add(bg);

            // Icon
            const icon = this.add.text(50, y, option.icon, {
                font: '20px monospace',
                fill: '#ffffff'
            }).setOrigin(0, 0.5);
            this.contentContainer.add(icon);

            // Name
            const name = this.add.text(85, y - 5, option.name, {
                font: 'bold 14px monospace',
                fill: '#ffffff'
            }).setOrigin(0, 0.5);
            this.contentContainer.add(name);

            // Description
            const desc = this.add.text(85, y + 10, option.desc, {
                font: '10px monospace',
                fill: '#888888'
            }).setOrigin(0, 0.5);
            this.contentContainer.add(desc);

            // Make it interactive
            bg.setInteractive(new Phaser.Geom.Rectangle(30, y - 18, GAME_WIDTH - 60, 40), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', () => {
                this.selectedIndex = index;
                this.updateMainMenuSelection();
                option.action();
            });
            bg.on('pointerover', () => {
                this.selectedIndex = index;
                this.updateMainMenuSelection();
            });

            this.menuItems.push({ bg, name, desc, icon, action: option.action, y });
        });

        // Selection box
        this.selectionBox = this.add.graphics();
        this.contentContainer.add(this.selectionBox);
        this.updateMainMenuSelection();

        // Hint at bottom
        const hint = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT - 25, 'Press M or ESC to close', {
            font: '9px monospace',
            fill: '#555555'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(hint);
    }

    addPlayerHeader() {
        const hp = NetworkManager.getHP();
        const maxHp = NetworkManager.getMaxHP();
        const mp = NetworkManager.getMP();
        const maxMp = NetworkManager.getMaxMP();
        const gold = NetworkManager.getGold();
        const level = NetworkManager.getLevel();
        const sprite = NetworkManager.getSprite();

        // Header background
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x1a1a2e, 1);
        headerBg.fillRoundedRect(20, 55, GAME_WIDTH - 40, 90, 8);
        headerBg.lineStyle(1, 0x3a3a5e, 1);
        headerBg.strokeRoundedRect(20, 55, GAME_WIDTH - 40, 90, 8);
        this.contentContainer.add(headerBg);

        // Hero sprite
        const heroSprite = this.add.sprite(55, 100, 'heroes', sprite);
        heroSprite.setScale(0.7);
        this.contentContainer.add(heroSprite);

        // Level
        const levelText = this.add.text(90, 65, `Lv. ${level}`, {
            font: 'bold 12px monospace',
            fill: '#f4d03f'
        });
        this.contentContainer.add(levelText);

        // HP
        const hpText = this.add.text(90, 82, `HP: ${hp}/${maxHp}`, {
            font: '10px monospace',
            fill: '#ff6666'
        });
        this.contentContainer.add(hpText);

        // HP Bar
        const hpBarBg = this.add.graphics();
        hpBarBg.fillStyle(0x333333, 1);
        hpBarBg.fillRect(90, 95, 100, 6);
        this.contentContainer.add(hpBarBg);

        const hpPercent = maxHp > 0 ? hp / maxHp : 0;
        const hpBarFill = this.add.graphics();
        hpBarFill.fillStyle(hpPercent > 0.5 ? 0x44ff44 : (hpPercent > 0.25 ? 0xffff00 : 0xff4444), 1);
        hpBarFill.fillRect(90, 95, 100 * hpPercent, 6);
        this.contentContainer.add(hpBarFill);

        // MP
        const mpText = this.add.text(90, 105, `MP: ${mp}/${maxMp}`, {
            font: '10px monospace',
            fill: '#6688ff'
        });
        this.contentContainer.add(mpText);

        // MP Bar
        const mpBarBg = this.add.graphics();
        mpBarBg.fillStyle(0x333333, 1);
        mpBarBg.fillRect(90, 118, 100, 6);
        this.contentContainer.add(mpBarBg);

        const mpPercent = maxMp > 0 ? mp / maxMp : 0;
        const mpBarFill = this.add.graphics();
        mpBarFill.fillStyle(0x4488ff, 1);
        mpBarFill.fillRect(90, 118, 100 * mpPercent, 6);
        this.contentContainer.add(mpBarFill);

        // Gold
        const goldText = this.add.text(90, 130, `💰 ${gold}G`, {
            font: '10px monospace',
            fill: '#f4d03f'
        });
        this.contentContainer.add(goldText);

        // Location
        const locationText = this.returnScene === 'DungeonScene' ? 'Slime Cave' : 'Pebble Village';
        const location = this.add.text(220, 100, `📍 ${locationText}`, {
            font: '10px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0, 0.5);
        this.contentContainer.add(location);
    }

    updateMainMenuSelection() {
        if (!this.selectionBox) return;

        this.selectionBox.clear();

        if (this.menuItems.length > 0 && this.menuItems[this.selectedIndex]) {
            const item = this.menuItems[this.selectedIndex];
            this.selectionBox.lineStyle(2, 0xf4d03f, 1);
            this.selectionBox.strokeRoundedRect(30, item.y - 18, GAME_WIDTH - 60, 40, 6);

            // Update colors
            this.menuItems.forEach((menuItem, idx) => {
                const isSelected = idx === this.selectedIndex;
                menuItem.name.setColor(isSelected ? '#f4d03f' : '#ffffff');
            });
        }
    }

    // ============ ITEMS SUBMENU ============
    showItemsMenu() {
        this.clearContent();
        this.currentView = 'items';
        this.subMenuSelection = 0;

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 30, '🎒 ITEMS', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        // Get consumable items
        const inventory = NetworkManager.getInventory();
        const items = inventory.filter(item => item.type === 'consumable');

        if (items.length === 0) {
            const emptyText = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT / 2, 'No items in inventory!\n\nFind treasure in the dungeon...', {
                font: '12px monospace',
                fill: '#666666',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            this.contentContainer.add(emptyText);
        } else {
            const startY = 70;
            const lineHeight = 45;

            items.forEach((item, index) => {
                const y = startY + (index * lineHeight);

                const bg = this.add.graphics();
                bg.fillStyle(0x1a1a2e, 1);
                bg.fillRoundedRect(30, y - 15, GAME_WIDTH - 60, 38, 6);
                this.contentContainer.add(bg);

                const itemIcon = this.add.text(50, y, '🧪', {
                    font: '16px monospace'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(itemIcon);

                const itemName = this.add.text(80, y - 5, item.name, {
                    font: 'bold 12px monospace',
                    fill: '#ffffff'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(itemName);

                const itemQty = this.add.text(80, y + 10, `Qty: ${item.quantity || 1}`, {
                    font: '10px monospace',
                    fill: '#888888'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(itemQty);

                // Use button
                const useBtn = this.add.text(250, y, '[USE]', {
                    font: '10px monospace',
                    fill: '#44ff44'
                }).setOrigin(0.5, 0.5);
                useBtn.setInteractive({ useHandCursor: true });
                useBtn.on('pointerdown', () => this.useItemOutsideCombat(item));
                this.contentContainer.add(useBtn);

                this.menuItems.push({ bg, name: itemName, item, y });
            });
        }

        // Back option
        this.addBackOption(items.length > 0 ? 70 + items.length * 45 + 30 : TOTAL_HEIGHT - 80);
        this.addSubMenuSelection();
    }

    useItemOutsideCombat(item) {
        // Only healing items work outside combat
        if (item.effect === 'heal' || item.name.toLowerCase().includes('potion')) {
            const hp = NetworkManager.getHP();
            const maxHp = NetworkManager.getMaxHP();

            if (hp >= maxHp) {
                this.showMessage('HP is already full!');
                return;
            }

            NetworkManager.useItem(item.itemId);
            this.showMessage(`Used ${item.name}!`);

            // Refresh the items menu
            this.time.delayedCall(500, () => {
                this.showItemsMenu();
            });
        } else {
            this.showMessage('Cannot use this item here!');
        }
    }

    // ============ MAGIC SUBMENU ============
    showMagicMenu() {
        this.clearContent();
        this.currentView = 'magic';
        this.subMenuSelection = 0;

        const level = NetworkManager.getLevel();
        const mp = NetworkManager.getMP();
        const magic = NetworkManager.getMagic();

        // Title with MP display
        const title = this.add.text(GAME_WIDTH / 2, 30, '✨ MAGIC', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        // MP display
        const mpDisplay = this.add.text(GAME_WIDTH / 2, 50, `MP: ${mp}/${NetworkManager.getMaxMP()}`, {
            font: '11px monospace',
            fill: '#6688ff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(mpDisplay);

        // Get spells player has learned based on level
        const learnedSpells = getOutOfCombatSpells(level);

        if (learnedSpells.length === 0) {
            const emptyText = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT / 2 - 30, 'No spells available!\n\nReach Level 5 to learn Heal\nReach Level 8 to learn Return', {
                font: '11px monospace',
                fill: '#666666',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            this.contentContainer.add(emptyText);
        } else {
            const startY = 90;
            const lineHeight = 55;

            learnedSpells.forEach((spell, index) => {
                const y = startY + (index * lineHeight);
                const canAfford = mp >= spell.mpCost;
                const power = calculateSpellPower(spell, magic);

                const bg = this.add.graphics();
                bg.fillStyle(canAfford ? 0x1a1a2e : 0x1a1a1a, 1);
                bg.fillRoundedRect(30, y - 20, GAME_WIDTH - 60, 48, 6);
                this.contentContainer.add(bg);

                // Spell icon based on type
                const iconMap = { 'heal': '💚', 'teleport': '🌀', 'damage': '🔥' };
                const spellIcon = this.add.text(50, y, iconMap[spell.effectType] || '🔮', {
                    font: '16px monospace'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(spellIcon);

                const spellName = this.add.text(80, y - 10, spell.name, {
                    font: 'bold 12px monospace',
                    fill: canAfford ? '#aa66ff' : '#666666'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(spellName);

                // MP cost
                const mpCostText = this.add.text(200, y - 10, `${spell.mpCost} MP`, {
                    font: '10px monospace',
                    fill: canAfford ? '#6688ff' : '#884444'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(mpCostText);

                // Description with power
                let descText = spell.description;
                if (spell.effectType === 'heal') {
                    descText = `Heals ${power} HP`;
                } else if (spell.effectType === 'teleport') {
                    descText = 'Return to town instantly';
                }

                const spellDesc = this.add.text(80, y + 8, descText, {
                    font: '10px monospace',
                    fill: '#888888'
                }).setOrigin(0, 0.5);
                this.contentContainer.add(spellDesc);

                // Cast button
                const castBtn = this.add.text(260, y, canAfford ? '[CAST]' : '[---]', {
                    font: '10px monospace',
                    fill: canAfford ? '#aa66ff' : '#444444'
                }).setOrigin(0.5, 0.5);
                if (canAfford) {
                    castBtn.setInteractive({ useHandCursor: true });
                    castBtn.on('pointerdown', () => this.castSpellOutsideCombat(spell));
                }
                this.contentContainer.add(castBtn);

                this.menuItems.push({ bg, name: spellName, spell, y, canAfford });
            });
        }

        // Back option
        this.addBackOption(learnedSpells.length > 0 ? 90 + learnedSpells.length * 55 + 30 : TOTAL_HEIGHT - 80);
        this.addSubMenuSelection();
    }

    castSpellOutsideCombat(spell) {
        const mp = NetworkManager.getMP();
        const hp = NetworkManager.getHP();
        const maxHp = NetworkManager.getMaxHP();
        const magic = NetworkManager.getMagic();

        // Check MP
        if (mp < spell.mpCost) {
            this.showMessage('Not enough MP!');
            return;
        }

        if (spell.effectType === 'heal') {
            if (hp >= maxHp) {
                this.showMessage('HP is already full!');
                return;
            }

            const healAmount = calculateSpellPower(spell, magic);
            NetworkManager.sendCastSpell(spell.id, spell.mpCost);
            this.showMessage(`Cast ${spell.name}! Healed ${healAmount} HP`);

            // Refresh the magic menu after a delay
            this.time.delayedCall(800, () => {
                this.showMagicMenu();
            });

        } else if (spell.effectType === 'teleport') {
            // Return spell - teleport to town
            if (this.returnScene === 'TownScene') {
                this.showMessage('Already in town!');
                return;
            }

            NetworkManager.sendCastSpell(spell.id, spell.mpCost);
            this.showMessage('Returning to town...');

            // Send return to town command and close menu
            NetworkManager.sendReturnToTown();

            this.time.delayedCall(1000, () => {
                this.scene.stop();
                this.scene.start('TownScene');
            });

        } else {
            this.showMessage('Cannot cast this spell here!');
        }
    }

    // ============ STATUS SUBMENU ============
    showStatusMenu() {
        this.clearContent();
        this.currentView = 'status';

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 30, '📊 STATUS', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        // Get all player stats
        const hp = NetworkManager.getHP();
        const maxHp = NetworkManager.getMaxHP();
        const level = NetworkManager.getLevel();
        const xp = NetworkManager.getXP();
        const xpToLevel = NetworkManager.getXPToLevel();
        const gold = NetworkManager.getGold();
        const strength = NetworkManager.getStrength();
        const defense = NetworkManager.getDefense();
        const magic = NetworkManager.getMagic();
        const sprite = NetworkManager.getSprite();

        // Hero sprite (larger)
        const heroSprite = this.add.sprite(GAME_WIDTH / 2, 90, 'heroes', sprite);
        heroSprite.setScale(1.2);
        this.contentContainer.add(heroSprite);

        // Stats panel
        const panelY = 150;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(25, panelY, GAME_WIDTH - 50, 275, 8);
        panelBg.lineStyle(1, 0x3a3a5e, 1);
        panelBg.strokeRoundedRect(25, panelY, GAME_WIDTH - 50, 275, 8);
        this.contentContainer.add(panelBg);

        const mp = NetworkManager.getMP();
        const maxMp = NetworkManager.getMaxMP();

        const stats = [
            { label: 'Level', value: level, color: '#f4d03f', icon: '⭐' },
            { label: 'HP', value: `${hp} / ${maxHp}`, color: '#ff6666', icon: '❤️' },
            { label: 'MP', value: `${mp} / ${maxMp}`, color: '#6688ff', icon: '💎' },
            { label: 'Experience', value: `${xp} / ${xpToLevel}`, color: '#44aaff', icon: '📈' },
            { label: 'XP to Level', value: xpToLevel - xp, color: '#44aaff', icon: '🎯' },
            { label: 'Gold', value: `${gold}G`, color: '#f4d03f', icon: '💰' },
            { label: 'Strength', value: strength, color: '#ff9944', icon: '⚔️' },
            { label: 'Defense', value: defense, color: '#4488ff', icon: '🛡️' },
            { label: 'Magic', value: magic, color: '#aa66ff', icon: '✨' }
        ];

        const startY = panelY + 25;
        const lineHeight = 28;

        stats.forEach((stat, index) => {
            const y = startY + (index * lineHeight);

            const iconText = this.add.text(40, y, stat.icon, {
                font: '12px monospace'
            });
            this.contentContainer.add(iconText);

            const labelText = this.add.text(65, y, stat.label + ':', {
                font: '11px monospace',
                fill: '#aaaaaa'
            });
            this.contentContainer.add(labelText);

            const valueText = this.add.text(280, y, String(stat.value), {
                font: 'bold 11px monospace',
                fill: stat.color
            }).setOrigin(1, 0);
            this.contentContainer.add(valueText);
        });

        // XP Bar
        const xpBarY = startY + 2 * lineHeight + 15;
        const xpProgress = xpToLevel > 0 ? xp / xpToLevel : 1;
        const xpBarBg = this.add.graphics();
        xpBarBg.fillStyle(0x333333, 1);
        xpBarBg.fillRect(65, xpBarY, 215, 6);
        this.contentContainer.add(xpBarBg);

        const xpBarFill = this.add.graphics();
        xpBarFill.fillStyle(0x44aaff, 1);
        xpBarFill.fillRect(65, xpBarY, 215 * xpProgress, 6);
        this.contentContainer.add(xpBarFill);

        // Back option
        this.addBackOption(TOTAL_HEIGHT - 60);

        // No item selection in status view, just back
        this.menuItems = [];
    }

    // ============ STATS (GAME STATISTICS) SUBMENU ============
    showStatsMenu() {
        this.clearContent();
        this.currentView = 'stats';

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 30, '📜 GAME STATS', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(title);

        // Get game statistics from game state
        const gameState = NetworkManager.getGameState();
        const stats = gameState?.statistics || {};

        // Stats panel
        const panelY = 60;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(25, panelY, GAME_WIDTH - 50, 320, 8);
        panelBg.lineStyle(1, 0x3a3a5e, 1);
        panelBg.strokeRoundedRect(25, panelY, GAME_WIDTH - 50, 320, 8);
        this.contentContainer.add(panelBg);

        const gameStats = [
            { label: 'Monsters Defeated', value: stats.monstersKilled || 0, icon: '💀' },
            { label: 'Battles Won', value: stats.battlesWon || 0, icon: '🏆' },
            { label: 'Battles Lost', value: stats.battlesLost || 0, icon: '😵' },
            { label: 'Times Fled', value: stats.timesFled || 0, icon: '🏃' },
            { label: 'Damage Dealt', value: stats.damageDealt || 0, icon: '⚔️' },
            { label: 'Damage Taken', value: stats.damageTaken || 0, icon: '💔' },
            { label: 'Parries', value: stats.successfulParries || 0, icon: '🛡️' },
            { label: 'Spells Cast', value: stats.spellsCast || 0, icon: '✨' },
            { label: 'Items Used', value: stats.itemsUsed || 0, icon: '🧪' },
            { label: 'Gold Earned', value: stats.goldEarned || 0, icon: '💰' },
            { label: 'Deepest Floor', value: stats.deepestFloor || 1, icon: '🏔️' },
            { label: 'Play Time', value: this.formatPlayTime(stats.playTimeSeconds || 0), icon: '⏱️' }
        ];

        const startY = panelY + 20;
        const lineHeight = 25;

        gameStats.forEach((stat, index) => {
            const y = startY + (index * lineHeight);

            const iconText = this.add.text(40, y, stat.icon, {
                font: '11px monospace'
            });
            this.contentContainer.add(iconText);

            const labelText = this.add.text(65, y, stat.label, {
                font: '10px monospace',
                fill: '#aaaaaa'
            });
            this.contentContainer.add(labelText);

            const valueText = this.add.text(280, y, String(stat.value), {
                font: 'bold 10px monospace',
                fill: '#ffffff'
            }).setOrigin(1, 0);
            this.contentContainer.add(valueText);
        });

        // Back option
        this.addBackOption(TOTAL_HEIGHT - 60);

        // No item selection in stats view, just back
        this.menuItems = [];
    }

    formatPlayTime(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ============ SHARED HELPERS ============
    addBackOption(y) {
        const backBg = this.add.graphics();
        backBg.fillStyle(0x2a2a3e, 1);
        backBg.fillRoundedRect(30, y - 15, GAME_WIDTH - 60, 35, 6);
        this.contentContainer.add(backBg);

        const backText = this.add.text(GAME_WIDTH / 2, y, '← Back', {
            font: 'bold 12px monospace',
            fill: '#ffaaaa'
        }).setOrigin(0.5, 0.5);
        this.contentContainer.add(backText);

        backBg.setInteractive(new Phaser.Geom.Rectangle(30, y - 15, GAME_WIDTH - 60, 35), Phaser.Geom.Rectangle.Contains);
        backBg.on('pointerdown', () => this.handleBack());
        backBg.on('pointerover', () => backText.setColor('#ffffff'));
        backBg.on('pointerout', () => backText.setColor('#ffaaaa'));

        this.backButton = { bg: backBg, text: backText, y };
    }

    addSubMenuSelection() {
        this.subSelectionBox = this.add.graphics();
        this.contentContainer.add(this.subSelectionBox);
        this.updateSubMenuSelection();
    }

    updateSubMenuSelection() {
        if (!this.subSelectionBox) return;

        this.subSelectionBox.clear();

        if (this.menuItems.length > 0 && this.subMenuSelection < this.menuItems.length) {
            const item = this.menuItems[this.subMenuSelection];
            this.subSelectionBox.lineStyle(2, 0xf4d03f, 1);
            this.subSelectionBox.strokeRoundedRect(30, item.y - 18, GAME_WIDTH - 60, 42, 6);
        }
    }

    moveSelection(direction) {
        if (this.currentView === 'main') {
            this.selectedIndex += direction;
            if (this.selectedIndex < 0) this.selectedIndex = this.menuItems.length - 1;
            if (this.selectedIndex >= this.menuItems.length) this.selectedIndex = 0;
            this.updateMainMenuSelection();
        } else if (this.currentView === 'items' || this.currentView === 'magic') {
            if (this.menuItems.length > 0) {
                this.subMenuSelection += direction;
                if (this.subMenuSelection < 0) this.subMenuSelection = this.menuItems.length - 1;
                if (this.subMenuSelection >= this.menuItems.length) this.subMenuSelection = 0;
                this.updateSubMenuSelection();
            }
        }
    }

    confirmSelection() {
        if (this.currentView === 'main') {
            if (this.menuItems[this.selectedIndex] && this.menuItems[this.selectedIndex].action) {
                this.menuItems[this.selectedIndex].action();
            }
        } else if (this.currentView === 'items') {
            if (this.menuItems[this.subMenuSelection]) {
                this.useItemOutsideCombat(this.menuItems[this.subMenuSelection].item);
            }
        } else if (this.currentView === 'magic') {
            if (this.menuItems[this.subMenuSelection]) {
                this.castSpellOutsideCombat(this.menuItems[this.subMenuSelection].spell);
            }
        } else {
            // Status or Stats view - just go back
            this.handleBack();
        }
    }

    handleBack() {
        if (this.currentView === 'main') {
            this.closeMenu();
        } else {
            this.showMainMenu();
        }
    }

    showMessage(text) {
        // Show a temporary message overlay
        const msgBg = this.add.graphics();
        msgBg.fillStyle(0x000000, 0.8);
        msgBg.fillRoundedRect(40, TOTAL_HEIGHT / 2 - 25, GAME_WIDTH - 80, 50, 8);

        const msg = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT / 2, text, {
            font: 'bold 12px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: [msgBg, msg],
            alpha: 0,
            delay: 1000,
            duration: 500,
            onComplete: () => {
                msgBg.destroy();
                msg.destroy();
            }
        });
    }

    closeMenu() {
        console.log('Menu closed');

        // Update the calling scene's UI before resuming
        if (this.callingScene) {
            if (this.callingScene.updateHearts) {
                this.callingScene.updateHearts();
            }
            if (this.callingScene.updateStatsText) {
                this.callingScene.updateStatsText();
            }
        }

        // Resume the scene that called us and stop this one
        this.scene.resume(this.returnScene);
        this.scene.stop();
    }
}
