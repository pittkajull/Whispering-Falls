import Phaser from 'phaser';
import { WhisperingPath } from './scenes/WhisperingPath.js';

export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;
export const TILE_SIZE = 16;
export const SCALE = 3;

export const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    parent: 'game-container',
    backgroundColor: '#2d5a3d',
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [WhisperingPath],
};
