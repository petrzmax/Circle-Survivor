import { CharacterType } from '@/types';

/**
 * Player stats interface - all modifiable stats
 */
export interface PlayerStats {
  // Core
  maxHp: number;
  speed: number;
  pickupRange: number;

  // Combat
  armor: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  critChance: number;
  critDamage: number;
  lifesteal: number;
  knockback: number;
  explosionRadius: number;
  projectileCount: number;
  pierce: number;
  attackRange: number;

  // Utility
  luck: number;
  xpMultiplier: number;
  goldMultiplier: number;
  dodge: number;
  thorns: number;
  regen: number;
  maxWeapons: number;

  // Health drop chances
  healthDropChance: number;
  healthDropValue: number;
  healthDropLuckMultiplier: number;
}

/**
 * Input state interface.
 * Digital booleans for keyboard, optional analog for gamepad.
 */
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;

  // Analog input (-1 to 1) - optional, provided by gamepad
  analogX?: number;
  analogY?: number;
}

/**
 * Player configuration
 */
export interface PlayerConfig {
  x: number;
  y: number;
  characterType?: CharacterType;
}
