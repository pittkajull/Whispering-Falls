import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config.js';

/**
 * React wrapper that creates / destroys the Phaser game instance.
 *
 * Props
 * -----
 * onReady  — optional callback fired once the Phaser.Game is running.
 *            Receives the game instance so a parent can grab scene refs.
 */
export function PhaserGame({ onReady }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (gameRef.current) return; // already running (StrictMode double-invoke guard)

        const game = new Phaser.Game({
            ...gameConfig,
            parent: containerRef.current,
        });

        gameRef.current = game;

        // Wait for the first scene to be ready before notifying the parent.
        game.events.once('ready', () => {
            onReady?.(game);
        });

        return () => {
            game.destroy(true);
            gameRef.current = null;
        };
    }, [onReady]);

    return (
        <div
            ref={containerRef}
            id="game-container"
            style={{
                width: '960px',
                height: '540px',
                imageRendering: 'pixelated',
            }}
        />
    );
}
