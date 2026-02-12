import { useEffect, useState } from 'preact/hooks';
import { EventBus } from '@/events/EventBus';
import { Player } from '@/domain/player/Player';
import { EntityManager } from '@/managers';
import { container } from 'tsyringe';

const entityManager = container.resolve(EntityManager);

/**
 * Hook that returns the Player entity directly from EntityManager.
 * Uses events as re-render triggers — no intermediate state object.
 * Returns null before character selection (player doesn't exist yet).
 */
export function usePlayer(): Player | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const rerender = (): void => {
      forceUpdate((n) => n + 1);
    };

    const subs = [
      EventBus.on('hudUpdate', rerender),
      EventBus.on('shopPlayerUpdated', rerender),
      EventBus.on('stateEntered', rerender),
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  try {
    return entityManager.getPlayer();
  } catch {
    return null; // Player not created yet (before character select)
  }
}
