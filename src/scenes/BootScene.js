import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Connect to server early
        NetworkManager.connect();
        // Show loading progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222244, 0.8);
        progressBox.fillRect(width / 2 - 80, height / 2 - 10, 160, 20);

        const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
            font: '16px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x44ff44, 1);
            progressBar.fillRect(width / 2 - 76, height / 2 - 6, 152 * value, 12);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load all sprite atlases
        this.load.atlas('monsters', '/monsters.png', '/monsters.json');
        this.load.atlas('heroes', '/heroes.png', '/heroes.json');
        this.load.atlas('gear', '/gear.png', '/gear.json');
        this.load.atlas('items', '/items.png', '/items.json');
        this.load.atlas('npcs', '/npcs.png', '/npcs.json');
        this.load.atlas('ui', '/ui.png', '/ui.json');
        this.load.atlas('effects', '/effects.png', '/effects.json');
        this.load.atlas('tiles-town', '/tiles-town.png', '/tiles-town.json');
        this.load.atlas('tiles-dungeon', '/tiles-dungeon.png', '/tiles-dungeon.json');
    }

    create() {
        console.log('All assets loaded!');

        // Check if we have stored credentials
        const storedUsername = localStorage.getItem('slime_kingdom_username');

        if (storedUsername) {
            // Wait for auto-login to complete
            console.log('Found stored user:', storedUsername, '- waiting for auto-login...');

            // Listen for gameState which signals successful login
            NetworkManager.onGameState((state) => {
                if (this.scene.isActive('BootScene')) {
                    const scene = state?.scene || 'TownScene';
                    console.log('Auto-login complete, starting:', scene);
                    this.scene.start(scene);
                }
            });

            // Timeout fallback - show login if auto-login fails
            this.time.delayedCall(3000, () => {
                if (this.scene.isActive('BootScene') && !NetworkManager.isLoggedIn()) {
                    console.log('Auto-login timeout, showing login screen');
                    localStorage.removeItem('slime_kingdom_username'); // Clear bad credentials
                    this.scene.start('LoginScene');
                }
            });
        } else {
            // No stored credentials, show login
            this.scene.start('LoginScene');
        }
    }
}
