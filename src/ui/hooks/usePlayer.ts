import { useEffect, useState } from 'preact/hooks';
import { EventBus } from '@/events/EventBus';
import { Player } from '@/entities';
import { RefObject } from 'preact';

interface PlayerState {
  hp: number;
  maxHp: number;
  gold: number;
}

/**
 * Hook that subscribes to existing game events and reads current player state.
 * Uses existing events (goldCollected, healthCollected, playerHit) as triggers.
 */
export function usePlayer(playerRef: RefObject<Player | null>): PlayerState {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Existing events trigger re-render, then we read current values
    const rerender = (): void => {
      forceUpdate((n) => n + 1);
    };

    const subs = [
      EventBus.on('goldCollected', rerender),
      EventBus.on('healthCollected', rerender),
      EventBus.on('playerHit', rerender),
      EventBus.on('stateEntered', rerender), // State changes affect player display
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  // Read current values directly from player entity
  const player = playerRef.current;
  return {
    hp: player?.hp ?? 0,
    maxHp: player?.maxHp ?? 100,
    gold: player?.gold ?? 0,
  };
}
