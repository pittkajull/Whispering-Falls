import { useState, useEffect, useCallback } from 'react';

/**
 * React overlay that sits on top of the Phaser canvas.
 * Renders dialog boxes, HUD, menus, etc. using HTML/CSS
 * so they stay crisp at any resolution.
 *
 * Receives the Phaser `game` instance so it can listen to
 * scene events for dialog triggers.
 */
export function GameUI({ game }) {
    const [dialog, setDialog] = useState(null);
    const [hint, setHint] = useState(null); // interaction hint text

    const handleDialogOpen = useCallback((data) => {
        setDialog(data);
    }, []);

    const handleDialogClose = useCallback(() => {
        setDialog(null);
    }, []);

    const handleNpcNear = useCallback((data) => {
        setHint('[E] Bicara');
    }, []);

    const handleNpcFar = useCallback(() => {
        setHint(null);
    }, []);

    useEffect(() => {
        if (!game) return;

        const scene = game.scene.getScene('WhisperingPath');
        if (!scene) return;

        scene.events.on('dialog-open', handleDialogOpen);
        scene.events.on('dialog-close', handleDialogClose);
        scene.events.on('npc-near', handleNpcNear);
        scene.events.on('npc-far', handleNpcFar);

        return () => {
            scene.events.off('dialog-open', handleDialogOpen);
            scene.events.off('dialog-close', handleDialogClose);
            scene.events.off('npc-near', handleNpcNear);
            scene.events.off('npc-far', handleNpcFar);
        };
    }, [game, handleDialogOpen, handleDialogClose, handleNpcNear, handleNpcFar]);

    return (
        <div className="game-ui">
            {/* ── Area title ── */}
            <div className="area-title">Whispering Path</div>

            {/* ── Interaction hint ── */}
            {hint && !dialog && (
                <div className="interaction-hint">{hint}</div>
            )}

            {/* ── Dialog box ── */}
            {dialog && (
                <div className="dialog-box">
                    <span className="dialog-speaker">{dialog.speaker}</span>
                    <p className="dialog-text">{dialog.text}</p>
                    <span className="dialog-prompt">[E / Space] to close</span>
                </div>
            )}
        </div>
    );
}
