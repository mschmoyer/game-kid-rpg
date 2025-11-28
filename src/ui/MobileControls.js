/**
 * MobileControls - On-screen D-pad for mobile devices
 * Displays a horizontal row of direction buttons: LEFT UP DOWN RIGHT + Action button
 * Can be added to any scene that needs movement controls
 */
export default class MobileControls {
    /**
     * @param {Phaser.Scene} scene - The scene to add controls to
     * @param {number} y - Y position for the controls (bottom of screen)
     * @param {boolean} showAction - Whether to show the action button (default: true)
     */
    constructor(scene, y, showAction = true) {
        this.scene = scene;

        // Direction states (checked by scene's update loop)
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;

        // Action button state (for interactions like SPACE)
        this.action = false;
        this.actionJustPressed = false;

        // Button size and spacing
        const btnSize = 40;
        const spacing = 6;

        // Container for all controls
        this.buttons = [];

        // D-pad on left side
        const dpadStartX = 10;
        const directions = [
            { key: 'left', label: '◀', x: dpadStartX },
            { key: 'up', label: '▲', x: dpadStartX + btnSize + spacing },
            { key: 'down', label: '▼', x: dpadStartX + (btnSize + spacing) * 2 },
            { key: 'right', label: '▶', x: dpadStartX + (btnSize + spacing) * 3 }
        ];

        directions.forEach(dir => {
            this.createButton(dir.x, y, btnSize, dir.label, dir.key);
        });

        // Action button on right side (for SPACE/interact)
        if (showAction) {
            this.createActionButton(320 - btnSize - 15, y, btnSize);
        }
    }

    /**
     * Create a single direction button
     */
    createButton(x, y, size, label, direction) {
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3a3a5e, 0.9);
        bg.fillRoundedRect(x, y, size, size, 8);
        bg.lineStyle(2, 0x5a5a8e, 1);
        bg.strokeRoundedRect(x, y, size, size, 8);
        bg.setDepth(200);

        // Label
        const text = this.scene.add.text(x + size/2, y + size/2, label, {
            font: 'bold 20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        text.setDepth(201);

        // Interactive zone (slightly larger than visual for easier touch)
        const hitArea = this.scene.add.rectangle(x + size/2, y + size/2, size + 10, size + 10);
        hitArea.setInteractive();
        hitArea.setDepth(202);
        hitArea.setAlpha(0.001); // Nearly invisible but still interactive

        // Press handlers
        hitArea.on('pointerdown', () => {
            this[direction] = true;
            bg.clear();
            bg.fillStyle(0x5a5a8e, 1);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x7a7aae, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffff00');
        });

        hitArea.on('pointerup', () => {
            this[direction] = false;
            bg.clear();
            bg.fillStyle(0x3a3a5e, 0.9);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x5a5a8e, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            this[direction] = false;
            bg.clear();
            bg.fillStyle(0x3a3a5e, 0.9);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x5a5a8e, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffffff');
        });

        this.buttons.push({ bg, text, hitArea });
    }

    /**
     * Create the action button (like A button on a controller)
     */
    createActionButton(x, y, size) {
        // Background - green color for action
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x4a7a4a, 0.9);
        bg.fillRoundedRect(x, y, size, size, 8);
        bg.lineStyle(2, 0x6a9a6a, 1);
        bg.strokeRoundedRect(x, y, size, size, 8);
        bg.setDepth(200);

        // Label
        const text = this.scene.add.text(x + size/2, y + size/2, 'A', {
            font: 'bold 18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        text.setDepth(201);

        // Interactive zone
        const hitArea = this.scene.add.rectangle(x + size/2, y + size/2, size + 10, size + 10);
        hitArea.setInteractive();
        hitArea.setDepth(202);
        hitArea.setAlpha(0.001);

        // Press handlers
        hitArea.on('pointerdown', () => {
            this.action = true;
            this.actionJustPressed = true;
            bg.clear();
            bg.fillStyle(0x6a9a6a, 1);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x8aba8a, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffff00');
        });

        hitArea.on('pointerup', () => {
            this.action = false;
            bg.clear();
            bg.fillStyle(0x4a7a4a, 0.9);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x6a9a6a, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            this.action = false;
            bg.clear();
            bg.fillStyle(0x4a7a4a, 0.9);
            bg.fillRoundedRect(x, y, size, size, 8);
            bg.lineStyle(2, 0x6a9a6a, 1);
            bg.strokeRoundedRect(x, y, size, size, 8);
            text.setColor('#ffffff');
        });

        this.buttons.push({ bg, text, hitArea });
    }

    /**
     * Check if action was just pressed this frame (for single-press actions)
     * Call this in update() and it will auto-reset
     */
    consumeAction() {
        if (this.actionJustPressed) {
            this.actionJustPressed = false;
            return true;
        }
        return false;
    }

    /**
     * Check if any direction is pressed (for movement check)
     */
    isMoving() {
        return this.left || this.right || this.up || this.down;
    }

    /**
     * Destroy all controls (call when scene shuts down)
     */
    destroy() {
        this.buttons.forEach(btn => {
            btn.bg.destroy();
            btn.text.destroy();
            btn.hitArea.destroy();
        });
        this.buttons = [];
    }
}
