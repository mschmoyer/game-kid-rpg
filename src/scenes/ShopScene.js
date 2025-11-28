import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH, TOTAL_HEIGHT } from '../constants.js';
import { SHOP_CATEGORIES, getItemIcon, getItemStats, formatGold } from '../data/items.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
        this.shopItems = [];
        this.selectedCategory = 0;
        this.selectedItem = 0;
        this.categoryButtons = [];
        this.itemElements = [];
        this.scrollOffset = 0;
        this.maxVisibleItems = 5;
    }

    init(data) {
        this.returnScene = data.returnScene || 'TownScene';
        this.callingScene = data.callingScene;
    }

    create() {
        // Full screen dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x1a1a2e, 0.98);
        overlay.fillRect(0, 0, GAME_WIDTH, TOTAL_HEIGHT);

        // Shop title with icon
        this.add.text(GAME_WIDTH / 2, 20, '🏪 SHOP', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Player gold display (top right)
        this.goldText = this.add.text(GAME_WIDTH - 20, 20, '', {
            font: 'bold 12px monospace',
            fill: '#ffdd00'
        }).setOrigin(1, 0.5);
        this.updateGoldDisplay();

        // Category tabs
        this.createCategoryTabs();

        // Items panel background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2a2a4e, 1);
        panelBg.fillRoundedRect(15, 80, GAME_WIDTH - 30, 320, 8);
        panelBg.lineStyle(2, 0x5a5a8e, 1);
        panelBg.strokeRoundedRect(15, 80, GAME_WIDTH - 30, 320, 8);

        // Items container (will be populated when items load)
        this.itemsContainer = this.add.container(0, 0);

        // Item description panel at bottom
        this.descBg = this.add.graphics();
        this.descBg.fillStyle(0x3a3a5e, 1);
        this.descBg.fillRoundedRect(15, 410, GAME_WIDTH - 30, 60, 8);

        this.descText = this.add.text(25, 420, 'Select an item to view details', {
            font: '10px monospace',
            fill: '#aaaaaa',
            wordWrap: { width: GAME_WIDTH - 60 }
        });

        this.statsText = this.add.text(25, 450, '', {
            font: '10px monospace',
            fill: '#88ff88'
        });

        // Close button
        const closeBtnBg = this.add.graphics();
        closeBtnBg.fillStyle(0x884444, 1);
        closeBtnBg.fillRoundedRect(GAME_WIDTH / 2 - 40, TOTAL_HEIGHT - 35, 80, 28, 5);

        const closeBtn = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT - 21, '❌ Close', {
            font: '12px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeShop());
        closeBtn.on('pointerover', () => closeBtn.setColor('#ffff00'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));

        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Request shop items from server
        this.requestShopItems();
    }

    createCategoryTabs() {
        const tabWidth = 90;
        const startX = (GAME_WIDTH - (tabWidth * SHOP_CATEGORIES.length)) / 2;

        SHOP_CATEGORIES.forEach((cat, index) => {
            const x = startX + index * tabWidth + tabWidth / 2;
            const isSelected = index === this.selectedCategory;

            const bg = this.add.graphics();
            bg.fillStyle(isSelected ? 0x5a5a8e : 0x3a3a5e, 1);
            bg.fillRoundedRect(x - tabWidth / 2 + 5, 45, tabWidth - 10, 28, 5);

            const text = this.add.text(x, 59, `${cat.icon} ${cat.name}`, {
                font: '10px monospace',
                fill: isSelected ? '#ffffff' : '#888888'
            }).setOrigin(0.5, 0.5);
            text.setInteractive({ useHandCursor: true });
            text.on('pointerdown', () => this.selectCategory(index));

            this.categoryButtons.push({ bg, text, index });
        });
    }

    selectCategory(index) {
        this.selectedCategory = index;
        this.selectedItem = 0;
        this.scrollOffset = 0;

        // Update tab visuals
        this.categoryButtons.forEach((btn, i) => {
            const isSelected = i === index;
            btn.bg.clear();
            btn.bg.fillStyle(isSelected ? 0x5a5a8e : 0x3a3a5e, 1);
            const tabWidth = 90;
            const startX = (GAME_WIDTH - (tabWidth * SHOP_CATEGORIES.length)) / 2;
            const x = startX + i * tabWidth + tabWidth / 2;
            btn.bg.fillRoundedRect(x - tabWidth / 2 + 5, 45, tabWidth - 10, 28, 5);
            btn.text.setColor(isSelected ? '#ffffff' : '#888888');
        });

        this.displayItems();
    }

    requestShopItems() {
        // Listen for shop items response
        if (NetworkManager.socket) {
            NetworkManager.socket.once('shopItems', (items) => {
                this.shopItems = items;
                this.displayItems();
            });
            NetworkManager.socket.emit('getShopItems');
        } else {
            // Fallback if not connected - show empty
            this.shopItems = [];
            this.displayItems();
        }
    }

    displayItems() {
        // Clear existing items
        this.itemsContainer.removeAll(true);
        this.itemElements = [];

        const category = SHOP_CATEGORIES[this.selectedCategory];
        const filteredItems = this.shopItems.filter(category.filter);

        if (filteredItems.length === 0) {
            const emptyText = this.add.text(GAME_WIDTH / 2, 200, 'No items available', {
                font: '12px monospace',
                fill: '#666666'
            }).setOrigin(0.5, 0.5);
            this.itemsContainer.add(emptyText);
            this.updateDescription(null);
            return;
        }

        const itemHeight = 55;
        const startY = 90;
        const playerGold = NetworkManager.getGold();

        // Display visible items
        const visibleItems = filteredItems.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleItems);

        visibleItems.forEach((item, index) => {
            const actualIndex = this.scrollOffset + index;
            const y = startY + index * itemHeight;
            const isSelected = actualIndex === this.selectedItem;
            const canAfford = playerGold >= item.buyPrice;

            // Item row background
            const rowBg = this.add.graphics();
            rowBg.fillStyle(isSelected ? 0x4a4a7e : 0x3a3a5e, 0.8);
            rowBg.fillRoundedRect(25, y, GAME_WIDTH - 50, 50, 5);
            if (isSelected) {
                rowBg.lineStyle(2, 0x88aaff, 1);
                rowBg.strokeRoundedRect(25, y, GAME_WIDTH - 50, 50, 5);
            }

            // Item icon
            const iconSprite = getItemIcon(item);
            const icon = this.add.sprite(50, y + 25, 'ui', iconSprite);
            icon.setScale(1);

            // Item name
            const nameColor = canAfford ? '#ffffff' : '#888888';
            const name = this.add.text(75, y + 10, item.name, {
                font: 'bold 11px monospace',
                fill: nameColor
            });

            // Item stats (brief)
            const stats = getItemStats(item);
            const statsShort = this.add.text(75, y + 28, stats, {
                font: '9px monospace',
                fill: '#aaaaaa'
            });

            // Price
            const priceColor = canAfford ? '#ffdd00' : '#ff6666';
            const price = this.add.text(GAME_WIDTH - 35, y + 20, `${item.buyPrice}G`, {
                font: 'bold 11px monospace',
                fill: priceColor
            }).setOrigin(1, 0.5);

            // Buy button (only if can afford)
            if (canAfford && isSelected) {
                const buyBtnBg = this.add.graphics();
                buyBtnBg.fillStyle(0x448844, 1);
                buyBtnBg.fillRoundedRect(GAME_WIDTH - 80, y + 32, 40, 16, 3);

                const buyBtn = this.add.text(GAME_WIDTH - 60, y + 40, 'BUY', {
                    font: 'bold 9px monospace',
                    fill: '#ffffff'
                }).setOrigin(0.5, 0.5);
                buyBtn.setInteractive({ useHandCursor: true });
                buyBtn.on('pointerdown', () => this.purchaseItem(item));

                this.itemsContainer.add([buyBtnBg, buyBtn]);
            }

            // Make row clickable
            const hitArea = this.add.rectangle(GAME_WIDTH / 2, y + 25, GAME_WIDTH - 50, 50, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => {
                this.selectedItem = actualIndex;
                this.displayItems();
            });

            this.itemsContainer.add([rowBg, icon, name, statsShort, price, hitArea]);
            this.itemElements.push({ item, index: actualIndex });
        });

        // Scroll indicators
        if (this.scrollOffset > 0) {
            const upArrow = this.add.text(GAME_WIDTH / 2, 85, '▲', {
                font: '12px monospace',
                fill: '#888888'
            }).setOrigin(0.5, 0.5);
            this.itemsContainer.add(upArrow);
        }

        if (this.scrollOffset + this.maxVisibleItems < filteredItems.length) {
            const downArrow = this.add.text(GAME_WIDTH / 2, 390, '▼', {
                font: '12px monospace',
                fill: '#888888'
            }).setOrigin(0.5, 0.5);
            this.itemsContainer.add(downArrow);
        }

        // Update description for selected item
        const selectedItemData = filteredItems[this.selectedItem];
        this.updateDescription(selectedItemData);
    }

    updateDescription(item) {
        if (!item) {
            this.descText.setText('Select an item to view details');
            this.statsText.setText('');
            return;
        }

        this.descText.setText(item.description || 'No description');
        this.statsText.setText(getItemStats(item));
    }

    updateGoldDisplay() {
        const gold = NetworkManager.getGold();
        this.goldText.setText(`💰 ${gold}G`);
    }

    purchaseItem(item) {
        const playerGold = NetworkManager.getGold();
        if (playerGold < item.buyPrice) {
            this.showMessage("Not enough gold!", '#ff6666');
            return;
        }

        // Send purchase request to server
        if (NetworkManager.socket) {
            NetworkManager.socket.emit('purchaseItem', { itemId: item.id });
            NetworkManager.socket.once('purchaseResult', (result) => {
                if (result.success) {
                    this.showMessage(`Purchased ${item.name}!`, '#88ff88');
                    this.updateGoldDisplay();
                    this.displayItems(); // Refresh to update affordability
                } else {
                    this.showMessage(result.error || 'Purchase failed!', '#ff6666');
                }
            });
        }
    }

    showMessage(text, color) {
        const msg = this.add.text(GAME_WIDTH / 2, TOTAL_HEIGHT / 2, text, {
            font: 'bold 14px monospace',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);
        msg.setDepth(1000);

        this.tweens.add({
            targets: msg,
            y: msg.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
    }

    update() {
        // Handle keyboard navigation
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.closeShop();
            return;
        }

        // Category switching with left/right
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            const newCat = Math.max(0, this.selectedCategory - 1);
            if (newCat !== this.selectedCategory) {
                this.selectCategory(newCat);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            const newCat = Math.min(SHOP_CATEGORIES.length - 1, this.selectedCategory + 1);
            if (newCat !== this.selectedCategory) {
                this.selectCategory(newCat);
            }
        }

        // Item selection with up/down
        const category = SHOP_CATEGORIES[this.selectedCategory];
        const filteredItems = this.shopItems.filter(category.filter);

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.selectedItem > 0) {
                this.selectedItem--;
                if (this.selectedItem < this.scrollOffset) {
                    this.scrollOffset = this.selectedItem;
                }
                this.displayItems();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (this.selectedItem < filteredItems.length - 1) {
                this.selectedItem++;
                if (this.selectedItem >= this.scrollOffset + this.maxVisibleItems) {
                    this.scrollOffset = this.selectedItem - this.maxVisibleItems + 1;
                }
                this.displayItems();
            }
        }

        // Purchase with Enter/Space
        if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const selectedItemData = filteredItems[this.selectedItem];
            if (selectedItemData) {
                this.purchaseItem(selectedItemData);
            }
        }
    }

    closeShop() {
        this.scene.stop();
        this.scene.resume(this.returnScene);
    }
}
