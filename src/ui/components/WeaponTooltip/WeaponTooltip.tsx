/**
 * WeaponTooltip component - displays weapon statistics on hover
 * Reusable for Shop and Inventory tabs
 */

import { SHOP_ITEMS, type WeaponShopItem } from '@/config/shop.config';
import { STAT_LABELS } from '@/config/stats-labels.config';
import { WEAPON_TYPES } from '@/domain/weapons/config';
import { WeaponConfig } from '@/domain/weapons/type';
import { WeaponStatsCalculator } from '@/domain/weapons/WeaponStatsCalculator';
import { ProjectileType } from '@/types';
import { CONTAINER_WIDTH, TOOLTIP_OFFSET, TOOLTIP_WIDTH } from '@/utils/viewport-scaler';
import { JSX } from 'preact';
import { container } from 'tsyringe';
import styles from './WeaponTooltip.module.scss';

const statsCalculator = container.resolve(WeaponStatsCalculator);

function getWeaponDescription(config: WeaponConfig): string | null {
  const shopItem = Object.values(SHOP_ITEMS).find(
    (item) => item.type === 'weapon' && item.name === config.name,
  ) as WeaponShopItem | undefined;
  return shopItem?.description ?? null;
}

interface WeaponTooltipProps {
  weaponData: { config: WeaponConfig; level: number } | null;
  position: { x: number; y: number };
}

export function WeaponTooltip({ weaponData, position }: WeaponTooltipProps): JSX.Element | null {
  if (!weaponData) return null;
  if (position.x === 0 && position.y === 0) return null;

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
  const description = getWeaponDescription(config);

  return (
    <div class={styles.tooltip} style={{ left: `${left}px`, top: `${top}px` }}>
      <div class={styles.header}>
        {config.emoji} {config.name} {level > 1 && `(Lvl ${level})`}
      </div>

      {description && <div class={styles.desc}>{description}</div>}

      <div class={styles.statsLabel}>Statystyki:</div>

      <div class={styles.stat}>
        {STAT_LABELS.damageMultiplier.emoji} {STAT_LABELS.damageMultiplier.label}: {damageDisplay}
      </div>
      <div class={styles.stat}>🔄 Przeładowanie: {cooldownSeconds} s</div>
      <div class={styles.stat}>
        {STAT_LABELS.attackRange.emoji} Zasięg: {config.range >= 9999 ? '∞' : config.range}
      </div>

      {config.pierceCount && (
        <div class={styles.stat}>
          {STAT_LABELS.pierce.emoji} {STAT_LABELS.pierce.label}: x{config.pierceCount}
        </div>
      )}

      {config.explosive && stats.explosionRadius && (
        <div class={styles.stat}>
          {STAT_LABELS.explosionRadius.emoji} {STAT_LABELS.explosionRadius.label}:{' '}
          {stats.explosionRadius}
        </div>
      )}

      {config.shortRange && <div class={styles.stat}>📍 Broń krótkiego zasięgu</div>}
      {config.deployableType && <div class={styles.stat}>⚙️ Do rozmieszczenia</div>}

      {config.projectileType === ProjectileType.BANANA &&
        (() => {
          const miniConfig = WEAPON_TYPES.minibanana;
          const weaponDamageMult = statsCalculator.getDamageMultiplier(level);
          const weaponExplosionMult = statsCalculator.getExplosionMultiplier(level);
          const miniDamage = Math.round(miniConfig.damage * weaponDamageMult);
          const miniExplosionRadius = Math.round(
            (miniConfig.explosionRadius ?? 45) * weaponExplosionMult,
          );
          return (
            <>
              <div class={styles.statsLabel}>Mini banany:</div>
              <div class={styles.stat}>🔢 Ilość: 4-6</div>
              <div class={styles.stat}>
                {STAT_LABELS.damageMultiplier.emoji} {STAT_LABELS.damageMultiplier.label}:{' '}
                {miniDamage}
              </div>
              <div class={styles.stat}>
                {STAT_LABELS.explosionRadius.emoji} {STAT_LABELS.explosionRadius.label}:{' '}
                {miniExplosionRadius}
              </div>
            </>
          );
        })()}
    </div>
  );
}
