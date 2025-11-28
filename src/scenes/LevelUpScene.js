import Phaser from 'phaser';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH } from '../constants.js';

export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    init(data) {
        this.newLevel = data.newLevel || 2;
        this.statGains = data.statGains || { maxHp: 2, strength: 1, defense: 0, magic: 0 };
        this.newStats = data.newStats || {};
        this.returnScene = data.returnScene || 'DungeonScene';
        this.returnData = data.returnData || {};
    }

    create() {
        // Dark celebratory background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Golden border effect
        const border = this.add.graphics();
        border.lineStyle(4, 0xffd700, 1);
        border.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);

        // Level Up title with animation
        const levelUpText = this.add.text(160, 60, 'LEVEL UP!', {
            font: 'bold 24px monospace',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5);

        // Pulse animation on title
        this.tweens.add({
            targets: levelUpText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // New level display
        this.add.text(160, 100, `Level ${this.newLevel}`, {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Stats gained section
        this.add.text(160, 140, '- Stats Gained -', {
            font: '12px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0.5);

        // Show each stat gain with animation delay
        const statStartY = 165;
        const stats = [];

        if (this.statGains.maxHp > 0) {
            stats.push({ label: '❤️ Max HP', value: `+${this.statGains.maxHp}`, color: '#ff6666' });
        }
        if (this.statGains.strength > 0) {
            stats.push({ label: '⚔️ Strength', value: `+${this.statGains.strength}`, color: '#ff9944' });
        }
        if (this.statGains.defense > 0) {
            stats.push({ label: '🛡️ Defense', value: `+${this.statGains.defense}`, color: '#4488ff' });
        }
        if (this.statGains.magic > 0) {
            stats.push({ label: '✨ Magic', value: `+${this.statGains.magic}`, color: '#aa66ff' });
        }

        // If no special gains, show a message
        if (stats.length === 0) {
            stats.push({ label: '💪 Keep fighting!', value: '', color: '#ffffff' });
        }

        // Create stat text with staggered animation
        stats.forEach((stat, index) => {
            const y = statStartY + (index * 28);

            const statText = this.add.text(160, y, `${stat.label} ${stat.value}`, {
                font: '14px monospace',
                fill: stat.color
            }).setOrigin(0.5, 0.5);

            // Start invisible, fade in with delay
            statText.setAlpha(0);
            this.tweens.add({
                targets: statText,
                alpha: 1,
                y: y - 5,
                duration: 400,
                delay: 300 + (index * 200),
                ease: 'Back.easeOut'
            });
        });

        // Show new total stats after gains animation
        const totalStatsY = statStartY + (stats.length * 28) + 20;
        const totalStatsText = this.add.text(160, totalStatsY, '', {
            font: '10px monospace',
            fill: '#888888',
            align: 'center'
        }).setOrigin(0.5, 0);
        totalStatsText.setAlpha(0);

        if (this.newStats.maxHp) {
            const statsStr = `❤️ ${this.newStats.maxHp}  ⚔️ ${this.newStats.strength}  🛡️ ${this.newStats.defense}  ✨ ${this.newStats.magic}`;
            totalStatsText.setText(statsStr);
        }

        this.tweens.add({
            targets: totalStatsText,
            alpha: 1,
            duration: 400,
            delay: 300 + (stats.length * 200) + 300
        });

        // UI Panel at bottom
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x1a1a2e, 1);
        uiPanel.fillRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);
        uiPanel.lineStyle(2, 0x3a3a5e, 1);
        uiPanel.lineBetween(0, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT);

        // Continue prompt (appears after animations)
        const continueText = this.add.text(160, GAME_HEIGHT + 100, 'Press SPACE or ENTER to continue', {
            font: '12px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        continueText.setAlpha(0);

        this.tweens.add({
            targets: continueText,
            alpha: 1,
            duration: 400,
            delay: 300 + (stats.length * 200) + 600,
            onComplete: () => {
                // Blink the continue text
                this.tweens.add({
                    targets: continueText,
                    alpha: 0.3,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Add sparkle effects
        this.createSparkles();

        // Input handling (only after animations complete)
        this.canContinue = false;
        this.time.delayedCall(300 + (stats.length * 200) + 400, () => {
            this.canContinue = true;
        });

        this.input.keyboard.on('keydown-SPACE', () => this.handleContinue());
        this.input.keyboard.on('keydown-ENTER', () => this.handleContinue());
        this.input.on('pointerdown', () => this.handleContinue());

        // Fade in when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);

        console.log(`Level up! Now level ${this.newLevel}`);
    }

    handleContinue() {
        if (!this.canContinue) return;
        this.canContinue = false;

        // Transition back to previous scene with fade
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(this.returnScene, this.returnData);
        });
    }

    createSparkles() {
        // Create some celebratory sparkle particles
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 150, () => {
                const x = 40 + Math.random() * (GAME_WIDTH - 80);
                const y = 40 + Math.random() * (GAME_HEIGHT - 100);

                const sparkle = this.add.sprite(x, y, 'effects', 'fx-sparkle');
                sparkle.setScale(0.5 + Math.random() * 0.5);
                sparkle.setAlpha(0);

                this.tweens.add({
                    targets: sparkle,
                    alpha: 1,
                    scale: sparkle.scale * 1.5,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => sparkle.destroy()
                });
            });
        }
    }
}
