import { useEffect, useState } from 'preact/hooks';
import { EventBus } from '@/events/EventBus';
import { WaveManager } from '@/systems/WaveManager';
import { container } from 'tsyringe';

const waveManager = container.resolve(WaveManager);

interface WaveState {
  waveNumber: number;
  timeRemaining: number;
  isWaveActive: boolean;
}

/**
 * Hook that returns wave/timer state from WaveManager.
 * Uses hudUpdate as the primary re-render trigger (fires every frame during gameplay).
 * Reads directly from WaveManager singleton — no duplicated state.
 */
export function useWave(): WaveState {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const rerender = (): void => {
      forceUpdate((n) => n + 1);
    };

    const subs = [
      EventBus.on('hudUpdate', rerender),
      EventBus.on('waveStart', rerender),
      EventBus.on('stateEntered', rerender),
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  try {
    return {
      waveNumber: waveManager.waveNumber,
      timeRemaining: waveManager.timeRemaining,
      isWaveActive: waveManager.isWaveActive,
    };
  } catch {
    return { waveNumber: 1, timeRemaining: 30, isWaveActive: false };
  }
}
