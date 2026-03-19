/**
 * ItemTooltip component — displays item stats on hover.
 * Mirrors WeaponTooltip pattern.
 */

import { ItemEffect, StatShopItem } from '@/config/shop.config';
import { STAT_LABELS } from '@/config/stats-labels.config';
import { CONTAINER_WIDTH, TOOLTIP_OFFSET, TOOLTIP_WIDTH } from '@/utils/viewport-scaler';
import { JSX } from 'preact';
import styles from './ItemTooltip.module.scss';

/**
 * Format functions for each ItemEffect key (how to display the delta value).
 * Emoji and label come from the shared STAT_LABELS config.
 */
const EFFECT_FORMATS: Record<keyof ItemEffect, (v: number) => string> = {
  armor: (v) => `+${v}`,
  maxHp: (v) => `+${v}`,
  regen: (v) => `+${v}/s`,
  dodge: (v) => `+${Math.round(v * 100)}%`,
  damageMultiplier: (v) => `+${Math.round(v * 100)}%`,
  critChance: (v) => `+${Math.round(v * 100)}%`,
  critDamage: (v) => `+${Math.round(v * 100)}%`,
  attackSpeedMultiplier: (v) => `+${Math.round(v * 100)}%`,
  speed: (v) => `+${Math.round(v * 100)}%`,
  lifesteal: (v) => `+${Math.round(v * 100)}%`,
  thorns: (v) => `+${Math.round(v * 100)}%`,
  luck: (v) => `+${Math.round(v * 100)}%`,
  xpMultiplier: (v) => `+${Math.round(v * 100)}%`,
  goldMultiplier: (v) => `+${Math.round(v * 100)}%`,
  pickupRange: (v) => `+${v}`,
  explosionRadius: (v) => `+${Math.round(v * 100)}%`,
  pierce: (v) => `+${v}`,
  projectileCount: (v) => `+${v}`,
  knockback: (v) => `+${Math.round(v * 100)}%`,
  attackRange: (v) => `+${Math.round(v * 100)}%`,
  maxWeapons: (v) => `+${v}`,
};

interface ItemTooltipProps {
  itemData: StatShopItem | null;
  position: { x: number; y: number };
}

export function ItemTooltip({ itemData, position }: ItemTooltipProps): JSX.Element | null {
  if (!itemData) return null;
  if (position.x === 0 && position.y === 0) return null;

  // Edge detection — flip to left if would overflow container
  const shouldFlipLeft = position.x + TOOLTIP_WIDTH + TOOLTIP_OFFSET > CONTAINER_WIDTH;
  const left = shouldFlipLeft
    ? position.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET
    : position.x + TOOLTIP_OFFSET;
  const top = position.y + TOOLTIP_OFFSET;

  const effectEntries = Object.entries(itemData.effect) as Array<[keyof ItemEffect, number]>;

  return (
    <div class={styles.tooltip} style={{ left: `${left}px`, top: `${top}px` }}>
      <div class={styles.header}>
        {itemData.emoji} {itemData.name}
      </div>
      <div class={styles.desc}>{itemData.description}</div>
      {effectEntries.length > 0 && (
        <>
          <div class={styles.effectsLabel}>Efekty:</div>
          {effectEntries.map(([key, value]) => {
            const { emoji, label } = STAT_LABELS[key];
            const format = EFFECT_FORMATS[key];
            return (
              <div class={styles.stat} key={key}>
                {emoji} {label}: {format(value)}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
