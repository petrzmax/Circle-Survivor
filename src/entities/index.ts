/**
 * Entities barrel export.
 * All game entity classes.
 */

export { Entity, generateEntityId, resetEntityIdCounter, type EntityConfig } from './Entity';

export {
  Projectile,
  type ProjectileConfig,
  type ExplosiveComponent,
  type PierceComponent,
  type ChainComponent,
} from './Projectile';

export { Deployable, type DeployableConfig } from './Deployable';

export {
  Enemy,
  type EnemyEntityConfig,
  type AttackResult,
  type BulletAttackResult,
  type ShockwaveAttackResult,
  type EnemyBulletData,
} from './Enemy';

export {
  Player,
  type PlayerConfig,
  type PlayerStats,
  type InputState,
} from './Player';

export {
  Pickup,
  type PickupConfig,
  createGoldPickup,
  createHealthPickup,
} from './Pickup';
