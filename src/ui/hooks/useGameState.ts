import { useEffect, useState } from 'preact/hooks';
import { EventBus } from '@/events/EventBus';
import { GameState } from '@/types/enums';

/**
 * Hook to track current game state from StateManager.
 * Subscribes to 'stateEntered' events.
 */
export function useGameState(): GameState {
  const [state, setState] = useState<GameState>(GameState.MENU);

  useEffect(() => {
    const subscription = EventBus.on('stateEntered', ({ state }) => {
      setState(state);
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
