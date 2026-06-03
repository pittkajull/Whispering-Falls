import { useCallback, useState } from 'react';
import { PhaserGame } from './components/PhaserGame.jsx';
import { GameUI } from './components/GameUI.jsx';

/**
 * Root component — mounts the Phaser canvas and layers
 * the React UI on top of it.
 */
export default function App() {
    const [game, setGame] = useState(null);

    const handleReady = useCallback((gameInstance) => {
        setGame(gameInstance);
        console.log('🎮 Whispering Falls is running', gameInstance);
    }, []);

    return (
        <div className="game-wrapper">
            <PhaserGame onReady={handleReady} />
            <GameUI game={game} />
        </div>
    );
}
