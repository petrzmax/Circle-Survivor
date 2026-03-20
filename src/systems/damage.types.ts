import { ProjectileType, VisualEffect } from '@/types/enums';
import { Vector2 } from '@/utils/math';

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
  /** Weapon-level damage multiplier — propagated to sub-munitions (e.g. mini bananas) */
  weaponLevelDamageMultiplier?: number;
  /** Weapon-level explosion radius multiplier — propagated to sub-munitions */
  weaponLevelExplosionMultiplier?: number;
}
