/**
 * MobileControls - Standard D-pad cross layout for mobile devices
 * Layout:     ▲
 *           ◀   ▶    [A]
 *             ▼
 */
import { BANNER_HEIGHT, GAME_HEIGHT, UI_HEIGHT, DPAD_HEIGHT, GAME_WIDTH } from '../constants.js';

export default class MobileControls {
    /**
     * @param {Phaser.Scene} scene - The scene to add controls to
     * @param {boolean} showAction - Whether to show the action button (default: true)
     */
    constructor(scene, showAction = true) {
        this.scene = scene;

        // Direction states (checked by scene's update loop)
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;

        // Action button state (for interactions like SPACE)
        this.action = false;
        this.actionJustPressed = false;

        // Button size
        const btnSize = 36;

        // D-pad center position (left side of screen)
        const dpadCenterX = 70;
        const dpadCenterY = BANNER_HEIGHT + GAME_HEIGHT + UI_HEIGHT + (DPAD_HEIGHT / 2);

        // Container for all controls
        this.buttons = [];

        // Draw d-pad background (dark circle)
        const dpadBg = scene.add.graphics();
        dpadBg.fillStyle(0x2a2a4e, 0.8);
        dpadBg.fillCircle(dpadCenterX, dpadCenterY, 52);
        dpadBg.setDepth(199);
        this.dpadBg = dpadBg;

        // D-pad buttons in cross layout
        const directions = [
            { key: 'up', label: '▲', x: dpadCenterX, y: dpadCenterY - btnSize },
            { key: 'down', label: '▼', x: dpadCenterX, y: dpadCenterY + btnSize },
            { key: 'left', label: '◀', x: dpadCenterX - btnSize, y: dpadCenterY },
            { key: 'right', label: '▶', x: dpadCenterX + btnSize, y: dpadCenterY }
        ];

        directions.forEach(dir => {
            this.createButton(dir.x, dir.y, btnSize, dir.label, dir.key);
        });

        // Action button on right side (for SPACE/interact)
        if (showAction) {
            this.createActionButton(GAME_WIDTH - 60, dpadCenterY, 44);
        }
    }

    /**
     * Create a single direction button
     */
    createButton(centerX, centerY, size, label, direction) {
        const x = centerX - size/2;
        const y = centerY - size/2;

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3a3a5e, 0.9);
        bg.fillRoundedRect(x, y, size, size, 6);
        bg.setDepth(200);

        // Label
        const text = this.scene.add.text(centerX, centerY, label, {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        text.setDepth(201);

        // Interactive zone
        const hitArea = this.scene.add.rectangle(centerX, centerY, size + 8, size + 8);
        hitArea.setInteractive();
        hitArea.setDepth(202);
        hitArea.setAlpha(0.001);

        // Press handlers
        hitArea.on('pointerdown', () => {
            this[direction] = true;
            bg.clear();
            bg.fillStyle(0x5a5a8e, 1);
            bg.fillRoundedRect(x, y, size, size, 6);
            text.setColor('#ffff00');
        });

        hitArea.on('pointerup', () => {
            this[direction] = false;
            bg.clear();
            bg.fillStyle(0x3a3a5e, 0.9);
            bg.fillRoundedRect(x, y, size, size, 6);
            text.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            this[direction] = false;
            bg.clear();
            bg.fillStyle(0x3a3a5e, 0.9);
            bg.fillRoundedRect(x, y, size, size, 6);
            text.setColor('#ffffff');
        });

        this.buttons.push({ bg, text, hitArea });
    }

    /**
     * Create the action button (like A button on a controller)
     */
    createActionButton(centerX, centerY, size) {
        const x = centerX - size/2;
        const y = centerY - size/2;

        // Background - green color for action
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x4a7a4a, 0.9);
        bg.fillRoundedRect(x, y, size, size, size/2); // Circular
        bg.lineStyle(2, 0x6a9a6a, 1);
        bg.strokeRoundedRect(x, y, size, size, size/2);
        bg.setDepth(200);

        // Label
        const text = this.scene.add.text(centerX, centerY, 'A', {
            font: 'bold 18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        text.setDepth(201);

        // Interactive zone
        const hitArea = this.scene.add.rectangle(centerX, centerY, size + 10, size + 10);
        hitArea.setInteractive();
        hitArea.setDepth(202);
        hitArea.setAlpha(0.001);

        // Press handlers
        hitArea.on('pointerdown', () => {
            this.action = true;
            this.actionJustPressed = true;
            bg.clear();
            bg.fillStyle(0x6a9a6a, 1);
            bg.fillRoundedRect(x, y, size, size, size/2);
            bg.lineStyle(2, 0x8aba8a, 1);
            bg.strokeRoundedRect(x, y, size, size, size/2);
            text.setColor('#ffff00');
        });

        hitArea.on('pointerup', () => {
            this.action = false;
            bg.clear();
            bg.fillStyle(0x4a7a4a, 0.9);
            bg.fillRoundedRect(x, y, size, size, size/2);
            bg.lineStyle(2, 0x6a9a6a, 1);
            bg.strokeRoundedRect(x, y, size, size, size/2);
            text.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            this.action = false;
            bg.clear();
            bg.fillStyle(0x4a7a4a, 0.9);
            bg.fillRoundedRect(x, y, size, size, size/2);
            bg.lineStyle(2, 0x6a9a6a, 1);
            bg.strokeRoundedRect(x, y, size, size, size/2);
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
        if (this.dpadBg) {
            this.dpadBg.destroy();
        }
        this.buttons.forEach(btn => {
            btn.bg.destroy();
            btn.text.destroy();
            btn.hitArea.destroy();
        });
        this.buttons = [];
    }
}
