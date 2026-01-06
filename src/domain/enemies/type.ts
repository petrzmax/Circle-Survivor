import { EnemyType } from '@/types';
import { Vector2 } from '@/utils';

export interface EnemyConfig {
  color: string;
  radius: number;
  speed: number;
  hp: number;
  damage: number;
  xpValue: number;
  goldValue: number;

  // Optional behaviors
  isBoss?: boolean; // TODO
  canShoot?: boolean;
  fireRate?: number;
  bulletSpeed?: number;
  bulletDamage?: number;
  attackPatterns?: AttackPattern[];

  // Special abilities
  phasing?: boolean;
  explodeOnDeath?: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
  zigzag?: boolean;
  splitOnDeath?: boolean;
  splitCount?: number;
}

/**
 * Attack pattern types for shooting enemies
 */
export type AttackPattern = 'single' | 'double' | 'spread' | 'shockwave' | 'around';

/**
 * Attack result types
 */
export interface BulletAttackResult {
  type: 'bullets';
  bullets: EnemyBulletData[];
}

export interface ShockwaveAttackResult {
  type: 'shockwave';
  x: number;
  y: number;
  radius: number;
  damage: number;
  color: string;
}

export type AttackResult = BulletAttackResult | ShockwaveAttackResult | null;

/**
 * Enemy bullet data (to be created by weapon system)
 */
export interface EnemyBulletData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
}

/**
 * Enemy configuration for constructor
 */
export interface EnemyEntityConfig {
  position: Vector2;
  type: EnemyType;
  /** Scale multiplier for split enemies */
  scale?: number;
}
