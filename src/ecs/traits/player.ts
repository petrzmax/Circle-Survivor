/**
 * Player-specific ECS traits — AoS callback-based for complex data.
 */

import { trait } from 'koota';
import type { CharacterConfig } from '@/config/characters.config';
import type { WeaponInstance } from '@/domain/weapons/type';
import { CharacterType } from '@/types/enums';
import { GAME_BALANCE } from '@/config';

/** Player combat & utility stats */
export const PlayerStats = trait(() => ({
  // Resources
  gold: 0,
  xp: 0,

  // Movement
  speedMultiplier: 1,
  pickupRange: 50,

  // Combat
  armor: 0,
  damageMultiplier: 1,
  attackSpeedMultiplier: 1,
  critChance: 0,
  critDamage: GAME_BALANCE.player.baseCritMultiplier as number,
  lifesteal: 0,
  knockback: 1,
  explosionRadius: 1,
  projectileCount: 0,
  pierce: 0,
  attackRange: 1,

  // Utility
  luck: 0,
  xpMultiplier: 1,
  goldMultiplier: 1,
  dodge: 0,
  thorns: 0,
  regen: 0,

  // Drop chances
  healthDropChance: GAME_BALANCE.drops.healthDropChance as number,
  healthDropValue: GAME_BALANCE.drops.healthDropValue as number,
  healthDropLuckMultiplier: GAME_BALANCE.drops.healthDropLuckMultiplier as number,

  // Debug
  godMode: false,

  // Slots
  maxWeapons: 6,

  // Invincibility
  invincibleUntil: 0,
  invincibilityDuration: GAME_BALANCE.player.invincibilityMs as number,

  // Auto-aim target position (set by PlayerSystem)
  // TODO why not vector2?
  currentTarget: null as { x: number; y: number } | null,
}));

/** Immutable character identity */
export const PlayerCharacter = trait(() => ({
  characterType: CharacterType.NORMIK,
  color: '',
  width: 30,
  height: 30,
  characterConfig: null as CharacterConfig | null,
}));

/** Weapon and item inventory */
export const WeaponInventory = trait(() => ({
  weapons: [] as WeaponInstance[],
  items: [] as string[],
}));
