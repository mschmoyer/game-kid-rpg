import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
        this.usernameText = '';
        this.inputActive = true;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Title
        this.add.text(160, 60, 'SLIME KINGDOM', {
            font: 'bold 20px monospace',
            fill: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        // Subtitle
        this.add.text(160, 90, 'A Dragon Quest-style Adventure', {
            font: '10px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0.5);

        // Input prompt
        this.add.text(160, 140, 'Enter your name:', {
            font: '12px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Input box background
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x2a2a4e, 1);
        inputBg.fillRoundedRect(60, 155, 200, 30, 5);
        inputBg.lineStyle(2, 0x4a4a6a, 1);
        inputBg.strokeRoundedRect(60, 155, 200, 30, 5);

        // Username display text
        this.usernameDisplay = this.add.text(160, 170, '_', {
            font: '14px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Instructions
        this.add.text(160, 210, 'Type your name and press ENTER', {
            font: '8px monospace',
            fill: '#888888'
        }).setOrigin(0.5, 0.5);

        // Status text
        this.statusText = this.add.text(160, 250, '', {
            font: '10px monospace',
            fill: '#ffaa00'
        }).setOrigin(0.5, 0.5);

        // Set up keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.inputActive) return;

            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ENTER) {
                this.submitLogin();
            } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
                this.usernameText = this.usernameText.slice(0, -1);
                this.updateDisplay();
            } else if (event.key.length === 1 && this.usernameText.length < 16) {
                // Only allow alphanumeric and common characters
                if (/^[a-zA-Z0-9_-]$/.test(event.key)) {
                    this.usernameText += event.key;
                    this.updateDisplay();
                }
            }
        });

        // Connect to server
        NetworkManager.connect();

        // Listen for successful login
        NetworkManager.onGameState((state) => {
            console.log('Login successful, starting game...');
            // Start the game at the saved scene/position
            const scene = state.scene || 'TownScene';
            const position = state.position || { x: 160, y: 160 };
            const dungeonFloor = state.dungeonFloor || 1;

            if (scene === 'DungeonScene') {
                this.scene.start('DungeonScene', {
                    floor: dungeonFloor,
                    startX: position.x,
                    startY: position.y
                });
            } else {
                this.scene.start('TownScene', {
                    startX: position.x,
                    startY: position.y
                });
            }
        });

        // Blinking cursor effect
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.inputActive) {
                    const text = this.usernameText + (this.usernameDisplay.text.endsWith('_') ? '' : '_');
                    this.usernameDisplay.setText(text || '_');
                }
            },
            loop: true
        });
    }

    updateDisplay() {
        this.usernameDisplay.setText(this.usernameText + '_');
    }

    submitLogin() {
        const username = this.usernameText.trim();

        if (username.length < 2) {
            this.statusText.setText('Name must be at least 2 characters');
            return;
        }

        this.inputActive = false;
        this.statusText.setText('Connecting to server...');

        // Check if connected to server
        if (!NetworkManager.isConnected()) {
            this.statusText.setText('Waiting for server...');
            this.retryConnection(username, 0);
            return;
        }

        this.attemptLogin(username);
    }

    retryConnection(username, attempts) {
        const maxAttempts = 10;

        if (NetworkManager.isConnected()) {
            this.attemptLogin(username);
            return;
        }

        if (attempts >= maxAttempts) {
            this.statusText.setText('Server unavailable. Start server first!');
            this.statusText.setFill('#ff6666');

            // Show help text
            this.add.text(160, 270, 'Run: npm run server', {
                font: '8px monospace',
                fill: '#888888'
            }).setOrigin(0.5, 0.5);

            this.inputActive = true;
            return;
        }

        this.statusText.setText(`Connecting... (${attempts + 1}/${maxAttempts})`);

        this.time.delayedCall(1000, () => {
            this.retryConnection(username, attempts + 1);
        });
    }

    attemptLogin(username) {
        const success = NetworkManager.login(username);

        if (!success) {
            this.statusText.setText('Login failed. Retrying...');
            this.time.delayedCall(1000, () => {
                this.retryConnection(username, 0);
            });
        } else {
            this.statusText.setText('Logging in...');

            // Timeout if no response
            this.time.delayedCall(10000, () => {
                if (this.scene.isActive('LoginScene')) {
                    this.statusText.setText('Login timeout. Check database!');
                    this.statusText.setFill('#ff6666');
                    this.inputActive = true;
                }
            });
        }
    }
}
