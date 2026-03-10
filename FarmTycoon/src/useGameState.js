import { useState, useEffect } from 'react';
import gameStore from './gameEngine';

export function useGameState() {
    const [gameState, setGameState] = useState(gameStore.G);

    useEffect(() => {
        // Initial load
        gameStore.load();
        const unsubscribe = gameStore.subscribe((newState) => {
            setGameState(newState);
        });
        return unsubscribe;
    }, []);

    return gameState;
}
