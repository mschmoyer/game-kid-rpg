import Phaser from 'phaser';
import { GAME_HEIGHT, UI_HEIGHT, GAME_WIDTH } from '../constants.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.defeatedBy = data.defeatedBy || 'a monster';
        this.floor = data.floor || 1;
    }

    create() {
        // Soft blue/purple background (not scary)
        this.cameras.main.setBackgroundColor('#2a2a4a');

        // Gentle stars in background
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * (GAME_HEIGHT - 40);
            const star = this.add.circle(x, y, 1 + Math.random() * 2, 0xffffaa, 0.3 + Math.random() * 0.4);

            // Gentle twinkling
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: 1000 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 1000
            });
        }

        // "Zzz" text floating above where hero will be
        const zzzText = this.add.text(200, 80, 'Zzz...', {
            font: '20px monospace',
            fill: '#88aaff'
        }).setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: zzzText,
            y: 70,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Show the KO hero sprite (lying down, sleeping with stars)
        const hero = this.add.sprite(160, 140, 'heroes', 'knight-ko');
        hero.setScale(2);

        // Gentle floating animation for hero
        this.tweens.add({
            targets: hero,
            y: 145,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Friendly "Game Over" text (not scary)
        const gameOverText = this.add.text(160, 200, 'Time for a Nap!', {
            font: 'bold 20px monospace',
            fill: '#ffcc44',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        // Subtitle
        this.add.text(160, 230, `Bonked by ${this.defeatedBy}`, {
            font: '12px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0.5);

        // Floor info
        if (this.floor > 1) {
            this.add.text(160, 250, `on Floor ${this.floor}`, {
                font: '10px monospace',
                fill: '#888888'
            }).setOrigin(0.5, 0.5);
        }

        // UI Panel at bottom
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x1a1a2e, 1);
        uiPanel.fillRect(0, GAME_HEIGHT, GAME_WIDTH, UI_HEIGHT);
        uiPanel.lineStyle(2, 0x3a3a5e, 1);
        uiPanel.lineBetween(0, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT);

        // "Try Again" button
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x44aa44, 1);
        buttonBg.fillRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);
        buttonBg.lineStyle(3, 0x66cc66, 1);
        buttonBg.strokeRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);

        const tryAgainText = this.add.text(160, GAME_HEIGHT + 105, 'Try Again!', {
            font: 'bold 16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Make button interactive
        const buttonZone = this.add.zone(160, GAME_HEIGHT + 105, 160, 50).setInteractive({ useHandCursor: true });

        buttonZone.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x55bb55, 1);
            buttonBg.fillRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);
            buttonBg.lineStyle(3, 0x77dd77, 1);
            buttonBg.strokeRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);
        });

        buttonZone.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x44aa44, 1);
            buttonBg.fillRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);
            buttonBg.lineStyle(3, 0x66cc66, 1);
            buttonBg.strokeRoundedRect(80, GAME_HEIGHT + 80, 160, 50, 8);
        });

        buttonZone.on('pointerdown', () => this.handleTryAgain());

        // Instruction text
        const instructionText = this.add.text(160, GAME_HEIGHT + 150, 'Press ENTER or click to continue', {
            font: '10px monospace',
            fill: '#888888'
        }).setOrigin(0.5, 0.5);

        // Blink instruction
        this.tweens.add({
            targets: instructionText,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Keyboard input
        this.input.keyboard.on('keydown-ENTER', () => this.handleTryAgain());
        this.input.keyboard.on('keydown-SPACE', () => this.handleTryAgain());

        // Fade in when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);

        console.log(`Game Over! Defeated by ${this.defeatedBy} on floor ${this.floor}`);
    }

    handleTryAgain() {
        // Return to town with full HP with fade
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TownScene');
        });
    }
}
