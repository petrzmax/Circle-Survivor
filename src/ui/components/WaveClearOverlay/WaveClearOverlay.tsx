import { EventBus } from '@/events/EventBus';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import styles from './WaveClearOverlay.module.scss';

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
    <div class={styles.overlay}>
      <div class={styles.content}>
        <div class={styles.icon}>⚔️</div>
        <div class={styles.title}>Fala {waveNumber} ukończona!</div>
      </div>
    </div>
  );
}
