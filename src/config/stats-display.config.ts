import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { STAT_LABELS } from './stats-labels.config';

export interface DisplayedStat {
  key: string;
  emoji: string;
  label: string;
  format: (player: LeaderboardPlayerStats) => string;
}

/**
 * Stats displayed in inventory and loadout detail views.
 * Uses shared STAT_LABELS for emoji/label, adds player-specific format functions.
 */
export const DISPLAYED_STATS: readonly DisplayedStat[] = [
  // Defensive
  {
    key: 'maxHp',
    ...STAT_LABELS.maxHp,
    format: (p) => `${p.maxHp}`,
  },
  {
    key: 'armor',
    ...STAT_LABELS.armor,
    format: (p) => `${Math.round((p.armor / (p.armor + 100)) * 100)}%`,
  },
  {
    key: 'dodge',
    ...STAT_LABELS.dodge,
    format: (p) => `${Math.round(p.dodge * 100)}%`,
  },
  {
    key: 'regen',
    ...STAT_LABELS.regen,
    format: (p) => `${p.regen.toFixed(1)}/s`,
  },
  {
    key: 'thorns',
    ...STAT_LABELS.thorns,
    format: (p) => `${Math.round(p.thorns * 100)}%`,
  },
  {
    key: 'lifesteal',
    ...STAT_LABELS.lifesteal,
    format: (p) => `${Math.round(p.lifesteal * 100)}%`,
  },
  // Offensive
  {
    key: 'damageMultiplier',
    ...STAT_LABELS.damageMultiplier,
    format: (p) => `+${Math.round((p.damageMultiplier - 1) * 100)}%`,
  },
  {
    key: 'critChance',
    ...STAT_LABELS.critChance,
    format: (p) => `${Math.round(p.critChance * 100)}%`,
  },
  {
    key: 'critDamage',
    ...STAT_LABELS.critDamage,
    format: (p) => `+${Math.round((p.critDamage - 1) * 100)}%`,
  },
  {
    key: 'attackSpeedMultiplier',
    ...STAT_LABELS.attackSpeedMultiplier,
    format: (p) => `+${Math.round((p.attackSpeedMultiplier - 1) * 100)}%`,
  },
  {
    key: 'attackRange',
    ...STAT_LABELS.attackRange,
    format: (p) => `+${Math.round((p.attackRange - 1) * 100)}%`,
  },
  {
    key: 'explosionRadius',
    ...STAT_LABELS.explosionRadius,
    format: (p) => `+${Math.round((p.explosionRadius - 1) * 100)}%`,
  },
  {
    key: 'knockback',
    ...STAT_LABELS.knockback,
    format: (p) => `+${Math.round((p.knockback - 1) * 100)}%`,
  },
  // Utility
  {
    key: 'speed',
    ...STAT_LABELS.speed,
    format: (p) => `+${Math.round((p.speedMultiplier - 1) * 100)}%`,
  },
  {
    key: 'pickupRange',
    ...STAT_LABELS.pickupRange,
    format: (p) => `${Math.round(p.pickupRange)}`,
  },
  {
    key: 'luck',
    ...STAT_LABELS.luck,
    format: (p) => `+${Math.round(p.luck * 100)}%`,
  },
  {
    key: 'xpMultiplier',
    ...STAT_LABELS.xpMultiplier,
    format: (p) => `+${Math.round((p.xpMultiplier - 1) * 100)}%`,
  },
  {
    key: 'goldMultiplier',
    ...STAT_LABELS.goldMultiplier,
    format: (p) => `+${Math.round((p.goldMultiplier - 1) * 100)}%`,
  },
];
