/**
 * Tag traits — no data, used as entity type markers and state flags.
 */

import { trait } from 'koota';

// ============ Entity Type Markers ============

/** Marks the player entity */
export const IsPlayer = trait();

/** Marks enemy entities */
export const IsEnemy = trait();

/** Marks projectile entities */
export const IsProjectile = trait();

/** Marks pickup entities */
export const IsPickup = trait();

/** Marks deployable entities */
export const IsDeployable = trait();

/** Marks shockwave entities */
export const IsShockwave = trait();

// ============ State Flags ============

/** Marks boss enemies */
export const IsBoss = trait();

/** Marks dead entities (deferred destruction) */
export const IsDead = trait();

/** Marks armed deployables (ready to trigger) */
export const IsArmed = trait();

/** Marks pickups being attracted to player */
export const IsAttracted = trait();

/** Marks player-owned projectiles/deployables */
export const IsPlayerOwned = trait();

/** Marks enemy-owned projectiles */
export const IsEnemyOwned = trait();

/** Marks entities clamped to arena bounds after entering */
export const ArenaBound = trait();
