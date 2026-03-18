/**
 * WeaponTooltip component - displays weapon statistics on hover
 * Reusable for Shop and Inventory tabs
 */

import { STAT_LABELS } from '@/config/stats-labels.config';
import { WeaponStatsCalculator } from '@/domain/weapons/WeaponStatsCalculator';
import { WeaponConfig } from '@/domain/weapons/type';
import { CONTAINER_WIDTH, TOOLTIP_OFFSET, TOOLTIP_WIDTH } from '@/utils/viewport-scaler';
import { JSX } from 'preact';
import { container } from 'tsyringe';
import './WeaponTooltip.css';

const statsCalculator = container.resolve(WeaponStatsCalculator);

interface WeaponTooltipProps {
  weaponData: { config: WeaponConfig; level: number } | null;
  position: { x: number; y: number };
}

export function WeaponTooltip({ weaponData, position }: WeaponTooltipProps): JSX.Element | null {
  if (!weaponData) return null;

  const { config, level } = weaponData;
  const stats = statsCalculator.calculate(config, level);

  // Edge detection - flip to left if would overflow container
  const shouldFlipLeft = position.x + TOOLTIP_WIDTH + TOOLTIP_OFFSET > CONTAINER_WIDTH;
  const left = shouldFlipLeft
    ? position.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET
    : position.x + TOOLTIP_OFFSET;
  const top = position.y + TOOLTIP_OFFSET;

  const damageDisplay =
    stats.bulletCount > 1 ? `${stats.bulletCount} x ${stats.damage}` : `${stats.damage}`;
  const cooldownSeconds = parseFloat((stats.fireRate / 1000).toFixed(3));

  return (
    <div class="weapon-tooltip" style={{ left: `${left}px`, top: `${top}px` }}>
      {/* Header */}
      <div class="weapon-tooltip-header">
        {config.emoji} {config.name} {level > 1 && `(Lvl ${level})`}
      </div>

      {/* Always show: Damage, Cooldown, Range */}
      <div class="weapon-tooltip-stat">
        {STAT_LABELS.damageMultiplier.emoji} {STAT_LABELS.damageMultiplier.label}: {damageDisplay}
      </div>
      <div class="weapon-tooltip-stat">🔄 Przeładowanie: {cooldownSeconds} s</div>
      <div class="weapon-tooltip-stat">
        {STAT_LABELS.attackRange.emoji} Zasięg: {config.range >= 9999 ? '∞' : config.range}
      </div>

      {/* Conditional: Pierce */}
      {config.pierceCount && (
        <div class="weapon-tooltip-stat">
          {STAT_LABELS.pierce.emoji} {STAT_LABELS.pierce.label}: x{config.pierceCount}
        </div>
      )}

      {/* Conditional: Explosive - show upgraded radius */}
      {config.explosive && stats.explosionRadius && (
        <div class="weapon-tooltip-stat">
          {STAT_LABELS.explosionRadius.emoji} {STAT_LABELS.explosionRadius.label}:{' '}
          {stats.explosionRadius}
        </div>
      )}

      {/* Special traits */}
      {config.shortRange && <div class="weapon-tooltip-stat">📍 Broń krótkiego zasięgu</div>}
      {config.deployableType && <div class="weapon-tooltip-stat">⚙️ Do rozmieszczenia</div>}
    </div>
  );
}
