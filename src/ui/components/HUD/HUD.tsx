import { JSX } from 'preact';
import { usePlayer } from '../../hooks/usePlayer';
import { useWave } from '../../hooks/useWave';
import styles from './HUD.module.scss';

interface HUDProps {
  visible: boolean;
}

export function HUD({ visible }: HUDProps): JSX.Element | null {
  const player = usePlayer();
  const wave = useWave();

  if (!visible || !player) return null;

  const { hp, maxHp, gold, xp } = player;
  const { waveNumber, timeRemaining, isWaveActive } = wave;
  const hpPercent = (hp / maxHp) * 100;
  const hpText = `${Math.ceil(hp)}/${maxHp}`;

  const timeDisplay = Math.ceil(timeRemaining);
  const isCountdownWarning = timeDisplay <= 3 && timeDisplay > 0 && isWaveActive;

  return (
    <div class={styles.hud}>
      <div class={`${styles.group} ${styles.groupTransparent}`}>
        <span id="hp-heart" class={styles.hpHeart}>
          ❤️
        </span>
        <div id="hp-bar" class={styles.hpBar}>
          <div id="hp-fill" class={styles.hpFill} style={{ width: `${hpPercent}%` }} />
          <span id="hp-text" class={styles.hpText}>
            {hpText}
          </span>
        </div>
      </div>
      <div class={styles.group}>
        <span>
          ⚔️ Fala <span id="wave-num">{waveNumber}</span>
        </span>
        <span class={styles.separator}>|</span>
        <span id="timer" class={isCountdownWarning ? styles.countdownWarning : ''}>
          🕐{' '}
          <span id="wave-timer" class={styles.waveTimer}>
            {timeDisplay}
          </span>
          s
        </span>
      </div>
      <div class={styles.group}>
        <span>
          💰{' '}
          <span id="gold-amount" class={styles.amount}>
            {gold}
          </span>
        </span>
        <span class={styles.separator}>|</span>
        <span>
          ⭐{' '}
          <span id="xp-amount" class={styles.amount}>
            {xp}
          </span>
        </span>
      </div>
    </div>
  );
}
