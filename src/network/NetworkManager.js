import { io } from 'socket.io-client';

class NetworkManager {
    constructor() {
        if (NetworkManager.instance) {
            return NetworkManager.instance;
        }

        this.socket = null;
        this.connected = false;
        this.loggedIn = false;

        // Store username for auto-reconnect
        this.username = localStorage.getItem('slime_kingdom_username') || null;

        // Local game state (synced from server)
        this.gameState = null;

        this.callbacks = {
            currentPlayers: [],
            playerJoined: [],
            playerMoved: [],
            playerLeft: [],
            playerSceneChange: [],
            gameState: [],
            levelUp: [],
            enemyData: [],
            error: []
        };

        // Pending enemy request resolve function
        this.pendingEnemyResolve = null;

        NetworkManager.instance = this;
    }

    connect() {
        // If already connected, don't reconnect (prevents infinite loops)
        if (this.socket && this.socket.connected) {
            return;
        }

        // Clean up any existing socket first (important for HMR)
        if (this.socket) {
            console.log('Cleaning up existing socket before reconnect');
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        try {
            // In production, connect to same origin; in dev, connect to localhost:3001
            const serverUrl = import.meta.env.PROD
                ? window.location.origin
                : 'http://localhost:3001';

            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('Connected to multiplayer server:', this.socket.id);
                this.connected = true;
                // Reset loggedIn on new connection - this socket hasn't authenticated yet
                this.loggedIn = false;

                // Auto-login if we have stored credentials (read fresh from localStorage)
                const storedUsername = localStorage.getItem('slime_kingdom_username');
                if (storedUsername) {
                    console.log('Auto-reconnecting as:', storedUsername);
                    this.username = storedUsername;
                    this.socket.emit('login', { username: storedUsername, characterName: storedUsername });
                }
            });

            this.socket.on('connect_error', (error) => {
                console.warn('Failed to connect to game server:', error.message);
                console.warn('Server required for persistence. Run: npm run server');
                this.connected = false;
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from multiplayer server');
                this.connected = false;
                this.loggedIn = false;
            });

            // Game state from server
            this.socket.on('gameState', (state) => {
                this.gameState = state;
                this.loggedIn = true;
                console.log('Game state received:', state);
                this.callbacks.gameState.forEach(callback => callback(state));
            });

            // Level up notification
            this.socket.on('levelUp', (data) => {
                console.log(`LEVEL UP! Now level ${data.newLevel}`, data.statGains);
                this.callbacks.levelUp.forEach(callback => callback(data));
            });

            // Enemy data response
            this.socket.on('enemyData', (data) => {
                console.log('Enemy data received:', data);
                if (this.pendingEnemyResolve) {
                    this.pendingEnemyResolve(data);
                    this.pendingEnemyResolve = null;
                }
                this.callbacks.enemyData.forEach(callback => callback(data));
            });

            // Error from server
            this.socket.on('error', (error) => {
                console.error('Server error:', error.message);
                this.callbacks.error.forEach(callback => callback(error));
            });

            // Multiplayer events
            this.socket.on('currentPlayers', (players) => {
                this.callbacks.currentPlayers.forEach(callback => callback(players));
            });

            this.socket.on('playerJoined', (player) => {
                this.callbacks.playerJoined.forEach(callback => callback(player));
            });

            this.socket.on('playerMoved', (movementData) => {
                this.callbacks.playerMoved.forEach(callback => callback(movementData));
            });

            this.socket.on('playerLeft', (playerId) => {
                this.callbacks.playerLeft.forEach(callback => callback(playerId));
            });

            this.socket.on('playerSceneChange', (data) => {
                this.callbacks.playerSceneChange.forEach(callback => callback(data));
            });

        } catch (error) {
            console.error('Error initializing socket:', error);
            this.connected = false;
        }
    }

    /**
     * Login to the server with username
     * Server will create account/character if needed
     */
    login(username, characterName = null) {
        if (this.socket && this.connected) {
            // Store username for auto-reconnect
            this.username = username;
            localStorage.setItem('slime_kingdom_username', username);

            this.socket.emit('login', { username, characterName: characterName || username });
            return true;
        }
        return false;
    }

    /**
     * Send player position update
     */
    sendPosition(x, y) {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('playerMovement', { x, y });
        }
    }

    /**
     * Notify server of scene change
     */
    sendSceneChange(scene, x, y, dungeonFloor = null) {
        if (this.socket && this.connected && this.loggedIn) {
            const data = { scene, x, y };
            if (dungeonFloor !== null) {
                data.dungeonFloor = dungeonFloor;
            }
            this.socket.emit('sceneChange', data);
        }
    }

    /**
     * Send combat result to server
     */
    sendCombatResult(enemyType, outcome, experienceGained, goldGained, dungeonFloor, newHp) {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('combatResult', {
                enemyType,
                outcome,
                experienceGained,
                goldGained,
                dungeonFloor,
                newHp
            });
        }
    }

    /**
     * Rest at inn to restore HP
     */
    sendRestAtInn() {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('restAtInn');
        }
    }

    /**
     * Use an item from inventory
     */
    sendUseItem(itemId) {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('useItem', { itemId });
        }
    }

    /**
     * Request enemy data for a floor (returns a promise)
     */
    requestEnemy(floor) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.connected) {
                // Return fallback enemy if not connected
                resolve({
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
                });
                return;
            }

            this.pendingEnemyResolve = resolve;
            this.socket.emit('requestEnemy', { floor });

            // Timeout after 3 seconds
            setTimeout(() => {
                if (this.pendingEnemyResolve === resolve) {
                    this.pendingEnemyResolve = null;
                    // Return fallback
                    resolve({
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
                    });
                }
            }, 3000);
        });
    }

    // Event listeners
    onGameState(callback) {
        this.callbacks.gameState.push(callback);
        // If we already have state, call immediately
        if (this.gameState) {
            callback(this.gameState);
        }
    }

    onLevelUp(callback) {
        this.callbacks.levelUp.push(callback);
    }

    onError(callback) {
        this.callbacks.error.push(callback);
    }

    onCurrentPlayers(callback) {
        this.callbacks.currentPlayers.push(callback);
    }

    onPlayerJoin(callback) {
        this.callbacks.playerJoined.push(callback);
    }

    onPlayerMove(callback) {
        this.callbacks.playerMoved.push(callback);
    }

    onPlayerLeave(callback) {
        this.callbacks.playerLeft.push(callback);
    }

    onPlayerSceneChange(callback) {
        this.callbacks.playerSceneChange.push(callback);
    }

    // Getters
    isConnected() {
        return this.connected;
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    getGameState() {
        return this.gameState;
    }

    // Helper getters for common state
    getHP() {
        return this.gameState?.stats?.hp ?? 3;
    }

    getMaxHP() {
        return this.gameState?.stats?.maxHp ?? 3;
    }

    getMP() {
        return this.gameState?.stats?.mp ?? 10;
    }

    getMaxMP() {
        return this.gameState?.stats?.maxMp ?? 10;
    }

    getGold() {
        return this.gameState?.gold ?? 0;
    }

    getLevel() {
        return this.gameState?.stats?.level ?? 1;
    }

    getAttack() {
        return this.gameState?.stats?.attack ?? 1;
    }

    // Alias for strength (DB column renamed from attack to strength)
    getStrength() {
        return this.gameState?.stats?.strength ?? this.gameState?.stats?.attack ?? 1;
    }

    getDefense() {
        return this.gameState?.stats?.defense ?? 0;
    }

    getMagic() {
        return this.gameState?.stats?.magic ?? 1;
    }

    getXP() {
        return this.gameState?.stats?.xp ?? 0;
    }

    getXPToLevel() {
        return this.gameState?.stats?.xpToLevel ?? 100;
    }

    getSprite() {
        return this.gameState?.sprite ?? 'hero-warrior';
    }

    getInventory() {
        return this.gameState?.inventory ?? [];
    }

    getStatistics() {
        return this.gameState?.statistics ?? {
            monstersKilled: 0,
            battlesWon: 0,
            battlesLost: 0,
            timesFled: 0,
            damageDealt: 0,
            damageTaken: 0,
            successfulParries: 0,
            spellsCast: 0,
            itemsUsed: 0,
            goldEarned: 0,
            deepestFloor: 1,
            playTimeSeconds: 0
        };
    }

    // Alias for sending use item
    useItem(itemId) {
        this.sendUseItem(itemId);
    }

    /**
     * Cast a spell (sends to server to deduct MP and track stats)
     * @param {string} spellId - The spell identifier
     * @param {number} mpCost - MP cost of the spell
     */
    sendCastSpell(spellId, mpCost) {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('castSpell', { spellId, mpCost });
        }
    }

    /**
     * Send updated statistics to server
     * @param {Object} stats - Statistics to update (only send changed values)
     */
    sendStatisticsUpdate(stats) {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('updateStatistics', stats);
        }
    }

    /**
     * Use Return spell to teleport to town
     */
    sendReturnToTown() {
        if (this.socket && this.connected && this.loggedIn) {
            this.socket.emit('returnToTown');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.loggedIn = false;
            this.gameState = null;
        }
    }
}

// Export singleton instance
const networkManager = new NetworkManager();
export default networkManager;
