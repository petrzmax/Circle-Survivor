import { JSX } from 'preact';

interface PlayerState {
  hp: number;
  maxHp: number;
  gold: number;
  xp: number;
  armor: number;
  damageMultiplier: number;
  critChance: number;
  dodge: number;
  regen: number;
}

interface HUDProps {
  visible: boolean;
  playerState: PlayerState;
  waveNumber: number;
  timeRemaining: number;
  isWaveActive: boolean;
}

export function HUD({
  visible,
  playerState,
  waveNumber,
  timeRemaining,
  isWaveActive,
}: HUDProps): JSX.Element | null {
  if (!visible) return null;

  const { hp, maxHp, gold, xp, armor, damageMultiplier, critChance, dodge, regen } = playerState;
  const hpPercent = (hp / maxHp) * 100;

  // TODO hmmm verify
  // Armor uses formula: reduction = armor / (armor + 100)
  const armorReduction = armor / (armor + 100);
  const armorPercent = Math.round(armorReduction * 100);
  const damagePercent = Math.round((damageMultiplier - 1) * 100);
  const critPercent = Math.round(critChance * 100);
  const dodgePercent = Math.round(dodge * 100);

  const timeDisplay = Math.ceil(timeRemaining);
  const isCountdownWarning = timeDisplay <= 3 && timeDisplay > 0 && isWaveActive;

  return (
    <>
      <div id="hud">
        <div id="hp-bar">
          <div id="hp-fill" style={{ width: `${hpPercent}%` }} />
          <span id="hp-text">
            {Math.ceil(hp)}/{maxHp}
          </span>
        </div>
        <div id="wave-info">
          Fala: <span id="wave-num">{waveNumber}</span>
        </div>
        <div id="timer" class={isCountdownWarning ? 'countdown-warning' : ''}>
          Czas: <span id="wave-timer">{timeDisplay}</span>s
        </div>
        <div id="gold">
          💰 <span id="gold-amount">{gold}</span>
        </div>
        <div id="xp">
          ⭐ <span id="xp-amount">{xp}</span>
        </div>
      </div>

      <div id="stats-panel">
        <div class="stat">
          🛡️ <span id="stat-armor">{armorPercent}%</span>
        </div>
        <div class="stat">
          ⚔️ <span id="stat-damage">+{damagePercent}%</span>
        </div>
        <div class="stat">
          🎯 <span id="stat-crit">{critPercent}%</span>
        </div>
        <div class="stat">
          💨 <span id="stat-dodge">{dodgePercent}%</span>
        </div>
        <div class="stat">
          💚 <span id="stat-regen">{regen.toFixed(1)}</span>/s
        </div>
      </div>
    </>
  );
}
