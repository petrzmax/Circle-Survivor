import { EventBus } from '@/events/EventBus';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const OVERLAY_DURATION_MS = 1200;

export function WaveClearOverlay(): JSX.Element | null {
  const [waveNumber, setWaveNumber] = useState<number | null>(null);

  useEffect(() => {
    const sub = EventBus.on('waveCleared', ({ waveNumber: wave }) => {
      setWaveNumber(wave);
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (waveNumber === null) return;

    const timer = setTimeout(() => {
      setWaveNumber(null);
      EventBus.emit('waveClearAnimationDone', undefined);
    }, OVERLAY_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [waveNumber]);

  if (waveNumber === null) return null;

  return (
    <div class="wave-clear-overlay">
      <div class="wave-clear-content">
        <div class="wave-clear-icon">⚔️</div>
        <div class="wave-clear-title">Fala {waveNumber} ukończona!</div>
      </div>
    </div>
  );
}
