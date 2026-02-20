import { JSX } from 'preact';
import { usePlayer } from '../hooks/usePlayer';
import { useWave } from '../hooks/useWave';

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
    <div id="hud">
      <div class="hud-group hud-group--transparent">
        <span id="hp-heart">❤️</span>
        <div id="hp-bar">
          <div id="hp-fill" style={{ width: `${hpPercent}%` }} />
          <span id="hp-text">{hpText}</span>
        </div>
      </div>
      <div class="hud-group">
        <span id="wave-info">
          ⚔️ Fala <span id="wave-num">{waveNumber}</span>
        </span>
        <span class="hud-separator">|</span>
        <span id="timer" class={isCountdownWarning ? 'countdown-warning' : ''}>
          🕐 <span id="wave-timer">{timeDisplay}</span>s
        </span>
      </div>
      <div class="hud-group">
        <span id="gold">
          💰 <span id="gold-amount">{gold}</span>
        </span>
        <span class="hud-separator">|</span>
        <span id="xp">
          ⭐ <span id="xp-amount">{xp}</span>
        </span>
      </div>
    </div>
  );
}
