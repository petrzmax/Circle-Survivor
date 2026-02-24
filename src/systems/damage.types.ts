import { Vector2 } from '@/utils/math';
import { ProjectileType, VisualEffect } from '@/types/enums';

// ============ Damage Source ============

/**
 * Categorizes the source of damage for event payloads and audio/visual feedback.
 */
export enum DamageSource {
  ENEMY_CONTACT = 'enemyContact',
  ENEMY_PROJECTILE = 'enemyProjectile',
  EXPLOSION = 'explosion',
  SHOCKWAVE = 'shockwave',
  THORNS = 'thorns',
}

// ============ Explosion Origin ============

/**
 * Distinguishes explosion types for weapon side-effects (e.g. mini-banana spawning).
 */
export enum ExplosionOrigin {
  STANDARD = 'standard',
  BANANA = 'banana',
  MINI_BANANA = 'miniBanana',
}

/** Maps projectile types to their explosion origin. Unlisted types default to STANDARD. */
const PROJECTILE_EXPLOSION_ORIGIN: Partial<Record<ProjectileType, ExplosionOrigin>> = {
  [ProjectileType.BANANA]: ExplosionOrigin.BANANA,
  [ProjectileType.MINI_BANANA]: ExplosionOrigin.MINI_BANANA,
};

export function getExplosionOrigin(type: ProjectileType): ExplosionOrigin {
  return PROJECTILE_EXPLOSION_ORIGIN[type] ?? ExplosionOrigin.STANDARD;
}

// ============ Kill Source ============

/**
 * How an enemy was killed — used in enemyDeath event payload.
 */
export enum KillSource {
  PLAYER = 'player',
  EXPLOSION = 'explosion',
}

// ============ Damage Result ============

/**
 * Returned by DamageSystem.damageEntity() after processing a hit.
 */
export interface DamageResult {
  /** Actual damage dealt after armor/reductions (0 if blocked by godMode/invuln) */
  actualDamage: number;
  /** Whether the target's HP dropped to 0 or below */
  isDead: boolean;
}

// ============ Damageable Interface ============

export interface IDefenseStats {
  /** Armor value (diminishing returns reduction). */
  armor: number;
  /** Dodge chance [0..1]. */
  dodge: number;
  /** God mode flag (immune to all damage). */
  godMode: boolean;
  /** Timestamp until which entity is invincible. */
  invincibleUntil: number;
  /** Duration of invincibility after being hit (ms). */
  invincibilityDuration: number;
}

/**
 * Core damage target — the minimum data DamageSystem needs to modify HP and apply knockback.
 * Both Player and Enemy satisfy this structurally via their Entity base + health fields.
 */
export interface IDamageTarget {
  /** Entity ID for tracking */
  id: number;
  /** Current health */
  hp: number;
  /** Maximum health */
  maxHp: number;
  /** Position for knockback direction */
  position: Vector2;
  /** Knockback velocity X */
  knockbackX: number;
  /** Knockback velocity Y */
  knockbackY: number;
  /** Whether entity is active */
  isActive: boolean;
}

/**
 * Combined type for DamageSystem consumers.
 * Defense stats are optional — entities without them (enemies) are treated as unarmored.
 */
export type IDamageable = IDamageTarget & Partial<IDefenseStats>;

// ============ Explosion Event ============

/**
 * Data for a queued explosion.
 * `damage` is always **final offense-side damage** (pre-baked with multipliers by the caller).
 */
export interface ExplosionEvent {
  position: Vector2;
  radius: number;
  /** Final damage value — already includes offense multipliers */
  damage: number;
  visualEffect: VisualEffect;
  sourceId: number;
  /** What weapon/source created this explosion */
  origin?: ExplosionOrigin;
  /** If true, explosion damages player (enemy explosions only) */
  isEnemyExplosion?: boolean;
}
