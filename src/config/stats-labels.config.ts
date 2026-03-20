import { ItemEffect } from './shop.config';

export interface StatLabel {
  emoji: string;
  label: string;
}

/**
 * Human-readable labels for every ItemEffect key.
 * To add a new stat, just add an entry here — it will be available everywhere.
 */
export const STAT_LABELS: Record<keyof ItemEffect, StatLabel> = {
  maxHp: { emoji: '❤️', label: 'Życie' },
  armor: { emoji: '🛡️', label: 'Pancerz' },
  regen: { emoji: '💚', label: 'Regeneracja' },
  dodge: { emoji: '💨', label: 'Unik' },
  damageMultiplier: { emoji: '⚔️', label: 'Obrażenia' },
  critChance: { emoji: '🎯', label: 'Szansa na kryt' },
  critDamage: { emoji: '💥', label: 'Obrażenia kryt' },
  attackSpeedMultiplier: { emoji: '⚡', label: 'Szybkość ataku' },
  speedMultiplier: { emoji: '🏃', label: 'Prędkość' },
  lifesteal: { emoji: '🧛', label: 'Szansa na kradzież życia' },
  thorns: { emoji: '🌵', label: 'Odbicie obrażeń' },
  luck: { emoji: '🍀', label: 'Szczęście' },
  xpMultiplier: { emoji: '⭐', label: 'Mnożnik XP' },
  goldMultiplier: { emoji: '💰', label: 'Mnożnik złota' },
  pickupRange: { emoji: '🧲', label: 'Zasięg zbierania' },
  explosionRadius: { emoji: '💣', label: 'Zasięg eksplozji' },
  pierce: { emoji: '➡️', label: 'Przebicie' },
  projectileCount: { emoji: '🔢', label: 'Ilość pocisków' },
  knockback: { emoji: '💪', label: 'Odrzut' },
  attackRange: { emoji: '🔭', label: 'Zasięg ataku' },
  maxWeapons: { emoji: '🗡️', label: 'Maks. broni' },
};
