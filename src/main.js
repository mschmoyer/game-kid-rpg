import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import LoginScene from './scenes/LoginScene.js';
import TownScene from './scenes/TownScene.js';
import CombatScene from './scenes/CombatScene.js';
import DungeonScene from './scenes/DungeonScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import MenuScene from './scenes/MenuScene.js';
import ShopScene from './scenes/ShopScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Game dimensions
const GAME_WIDTH = 320;
const GAME_HEIGHT = 288;  // Main game area
const UI_HEIGHT = 200;    // Bottom UI panel

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT + UI_HEIGHT,  // 488 total
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false  // Show collision boxes (set to false when done debugging)
        }
    },
    scene: [BootScene, LoginScene, TownScene, CombatScene, DungeonScene, LevelUpScene, MenuScene, ShopScene, GameOverScene]
};

const game = new Phaser.Game(config);
