import Phaser from 'phaser';
import NetworkManager from '../network/NetworkManager.js';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
        this.usernameText = '';
        this.inputActive = true;
        this.domInput = null;
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

        // Create real HTML input element for mobile keyboard support
        this.createDOMInput();

        // Instructions
        this.add.text(160, 210, 'Tap the box and type your name', {
            font: '8px monospace',
            fill: '#888888'
        }).setOrigin(0.5, 0.5);

        // Login button (for mobile - tap to submit)
        const loginBg = this.add.graphics();
        loginBg.fillStyle(0x4a7a4a, 1);
        loginBg.fillRoundedRect(110, 225, 100, 35, 8);
        loginBg.lineStyle(2, 0x6a9a6a, 1);
        loginBg.strokeRoundedRect(110, 225, 100, 35, 8);

        const loginButton = this.add.text(160, 242, 'START', {
            font: 'bold 14px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
        loginButton.setInteractive({ useHandCursor: true });
        loginButton.on('pointerdown', () => this.submitLogin());
        loginButton.on('pointerover', () => {
            loginBg.clear();
            loginBg.fillStyle(0x5a8a5a, 1);
            loginBg.fillRoundedRect(110, 225, 100, 35, 8);
            loginBg.lineStyle(2, 0x7aaa7a, 1);
            loginBg.strokeRoundedRect(110, 225, 100, 35, 8);
        });
        loginButton.on('pointerout', () => {
            loginBg.clear();
            loginBg.fillStyle(0x4a7a4a, 1);
            loginBg.fillRoundedRect(110, 225, 100, 35, 8);
            loginBg.lineStyle(2, 0x6a9a6a, 1);
            loginBg.strokeRoundedRect(110, 225, 100, 35, 8);
        });

        // Status text
        this.statusText = this.add.text(160, 280, '', {
            font: '10px monospace',
            fill: '#ffaa00'
        }).setOrigin(0.5, 0.5);

        // Also support Enter key on desktop
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.inputActive) {
                this.submitLogin();
            }
        });

        // Connect to server
        NetworkManager.connect();

        // Listen for successful login
        NetworkManager.onGameState((state) => {
            console.log('Login successful, starting game...');
            // Clean up DOM input before leaving scene
            this.destroyDOMInput();

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
    }

    /**
     * Create a real HTML input element positioned over the Phaser canvas
     * This triggers the mobile keyboard properly
     */
    createDOMInput() {
        // Get the game canvas to position the input correctly
        const canvas = this.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();

        // Calculate the scaled position of the input box
        // The game is 320x488 but scaled, so we need to find the actual position
        const scaleX = canvasRect.width / 320;
        const scaleY = canvasRect.height / 488;

        // Input box in game coords: x=60, y=155, width=200, height=30
        const inputX = canvasRect.left + (60 * scaleX);
        const inputY = canvasRect.top + (155 * scaleY);
        const inputW = 200 * scaleX;
        const inputH = 30 * scaleY;

        // Create the HTML input element
        this.domInput = document.createElement('input');
        this.domInput.type = 'text';
        this.domInput.maxLength = 16;
        this.domInput.placeholder = 'Your name...';
        this.domInput.autocomplete = 'off';
        this.domInput.autocapitalize = 'off';
        this.domInput.spellcheck = false;

        // Style to overlay on canvas
        this.domInput.style.cssText = `
            position: absolute;
            left: ${inputX}px;
            top: ${inputY}px;
            width: ${inputW}px;
            height: ${inputH}px;
            font-family: monospace;
            font-size: ${14 * Math.min(scaleX, scaleY)}px;
            text-align: center;
            background: rgba(42, 42, 78, 0.95);
            border: 2px solid #4a4a6a;
            border-radius: 5px;
            color: #ffffff;
            outline: none;
            padding: 0;
            box-sizing: border-box;
            z-index: 1000;
        `;

        // Add to document
        document.body.appendChild(this.domInput);

        // Handle input changes
        this.domInput.addEventListener('input', () => {
            // Filter to only allowed characters
            this.domInput.value = this.domInput.value.replace(/[^a-zA-Z0-9_-]/g, '');
            this.usernameText = this.domInput.value;
        });

        // Handle Enter key
        this.domInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.inputActive) {
                this.submitLogin();
            }
        });

        // Reposition on window resize
        this.resizeHandler = () => this.repositionInput();
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Reposition the DOM input when window resizes
     */
    repositionInput() {
        if (!this.domInput) return;

        const canvas = this.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();

        const scaleX = canvasRect.width / 320;
        const scaleY = canvasRect.height / 488;

        const inputX = canvasRect.left + (60 * scaleX);
        const inputY = canvasRect.top + (155 * scaleY);
        const inputW = 200 * scaleX;
        const inputH = 30 * scaleY;

        this.domInput.style.left = `${inputX}px`;
        this.domInput.style.top = `${inputY}px`;
        this.domInput.style.width = `${inputW}px`;
        this.domInput.style.height = `${inputH}px`;
        this.domInput.style.fontSize = `${14 * Math.min(scaleX, scaleY)}px`;
    }

    /**
     * Clean up DOM input element
     */
    destroyDOMInput() {
        if (this.domInput) {
            this.domInput.remove();
            this.domInput = null;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    updateDisplay() {
        // No longer needed - DOM input shows its own text
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
