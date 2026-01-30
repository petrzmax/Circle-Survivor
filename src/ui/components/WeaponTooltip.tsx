/**
 * WeaponTooltip component - displays weapon statistics on hover
 * Reusable for Shop and Inventory tabs
 */

import { WeaponStatsCalculator } from '@/domain/weapons/WeaponStatsCalculator';
import { WeaponConfig } from '@/domain/weapons/type';
import { JSX } from 'preact';
import { container } from 'tsyringe';
import './WeaponTooltip.css';

const statsCalculator = container.resolve(WeaponStatsCalculator);

const TOOLTIP_WIDTH = 200;
const TOOLTIP_OFFSET = 15;

interface WeaponTooltipProps {
  weaponData: { config: WeaponConfig; level: number } | null;
  position: { x: number; y: number };
}

export function WeaponTooltip({ weaponData, position }: WeaponTooltipProps): JSX.Element | null {
  if (!weaponData) return null;

  const { config, level } = weaponData;
  const stats = statsCalculator.calculate(config, level);

  // Edge detection - flip to left if would overflow right edge
  const shouldFlipLeft = position.x + TOOLTIP_WIDTH + TOOLTIP_OFFSET > window.innerWidth;
  const left = shouldFlipLeft
    ? position.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET
    : position.x + TOOLTIP_OFFSET;
  const top = position.y + TOOLTIP_OFFSET;

  const damageDisplay =
    stats.bulletCount > 1 ? `${stats.bulletCount} x ${stats.damage}` : `${stats.damage}`;
  const cooldownSeconds = (stats.fireRate / 1000).toFixed(3);

  return (
    <div class="weapon-tooltip" style={{ left: `${left}px`, top: `${top}px` }}>
      {/* Header */}
      <div class="weapon-tooltip-header">
        {config.emoji} {config.name} {level > 1 && `(Lvl ${level})`}
      </div>

      {/* Always show: Damage, Cooldown, Range */}
      <div class="weapon-tooltip-stat">⚔️ Obrażenia: {damageDisplay}</div>
      <div class="weapon-tooltip-stat">🔄 Przeładowanie: {cooldownSeconds} s</div>
      <div class="weapon-tooltip-stat">🔭 Zasięg: {config.range >= 9999 ? '∞' : config.range}</div>

      {/* Conditional: Pierce */}
      {config.pierceCount && (
        <div class="weapon-tooltip-stat">➡️ Przebicie: x{config.pierceCount}</div>
      )}

      {/* Conditional: Explosive - show upgraded radius */}
      {config.explosive && stats.explosionRadius && (
        <div class="weapon-tooltip-stat">💣 Zasięg eksplozji: {stats.explosionRadius}</div>
      )}

      {/* Special traits */}
      {config.shortRange && <div class="weapon-tooltip-stat">📍 Broń krótkiego zasięgu</div>}
      {config.deployableType && <div class="weapon-tooltip-stat">⚙️ Do rozmieszczenia</div>}
    </div>
  );
}
