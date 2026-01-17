import { useEffect, useState } from 'preact/hooks';
import { EventBus, GameEvents } from '@/core/EventBus';

/**
 * Hook to subscribe to EventBus events and get the latest payload.
 * Automatically cleans up subscription on unmount.
 */
export function useEventBus<K extends keyof GameEvents>(
  event: K,
  initialValue: GameEvents[K],
): GameEvents[K] {
  const [value, setValue] = useState<GameEvents[K]>(initialValue);

  useEffect(() => {
    const subscription = EventBus.on(event, (payload: GameEvents[K]) => {
      setValue(payload);
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [event]);

  return value;
}
