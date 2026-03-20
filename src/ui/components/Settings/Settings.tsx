import { AudioSystem } from '@/domain/audio/AudioSystem';
import { Leaderboard } from '@/ui/Leaderboard';
import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { container } from 'tsyringe';
import styles from './Settings.module.scss';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps): JSX.Element {
  const audioSystem = container.resolve(AudioSystem);
  const leaderboard = container.resolve(Leaderboard);

  const [volume, setVolume] = useState(Math.round(audioSystem.getVolume() * 100));
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const handleVolumeChange = (e: Event): void => {
    const value = Number((e.target as HTMLInputElement).value);
    setVolume(value);
    audioSystem.setVolume(value / 100);
  };

  const handleClearRanking = (): void => {
    leaderboard.clearLocalScores();
    setIsConfirmingClear(false);
    setIsCleared(true);
  };

  return (
    <div class={styles.overlay}>
      <h2>⚙️ Ustawienia</h2>

      <div class={styles.content}>
        <div class={styles.section}>
          <span class={styles.sectionTitle}>🔊 Głośność</span>
          <div class={styles.volumeRow}>
            <input
              class={styles.volumeSlider}
              type="range"
              min="0"
              max="100"
              value={volume}
              onInput={handleVolumeChange}
            />
            <span class={styles.volumeLabel}>{volume}%</span>
          </div>
        </div>

        <div class={styles.section}>
          <span class={styles.sectionTitle}>🏆 Ranking</span>
          {isCleared ? (
            <span class={styles.successMsg}>✅ Ranking lokalny wyczyszczony!</span>
          ) : isConfirmingClear ? (
            <div class={styles.confirmRow}>
              <span>Na pewno?</span>
              <button class={styles.confirmYes} onClick={handleClearRanking}>
                Tak
              </button>
              <button
                class={styles.confirmNo}
                onClick={(): void => {
                  setIsConfirmingClear(false);
                }}
              >
                Nie
              </button>
            </div>
          ) : (
            <button
              class={styles.dangerBtn}
              onClick={(): void => {
                setIsConfirmingClear(true);
              }}
            >
              🗑️ Wyczyść ranking lokalny
            </button>
          )}
        </div>
      </div>

      <button class={styles.closeBtn} onClick={onClose}>
        ⬅ Powrót
      </button>
    </div>
  );
}
