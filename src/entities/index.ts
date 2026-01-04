/**
 * Entities barrel export.
 * All game entity classes.
 */

export { Entity, generateEntityId, resetEntityIdCounter, type EntityConfig } from './Entity';

export {
  Projectile,
  type ExplosiveComponent,
  type PierceComponent,
  type ProjectileConfig,
} from './Projectile';

export { Deployable, type DeployableConfig } from './Deployable';

export {
  Enemy,
  type AttackResult,
  type BulletAttackResult,
  type EnemyBulletData,
  type EnemyEntityConfig,
  type ShockwaveAttackResult,
} from './Enemy';

export { Player, type InputState, type PlayerConfig, type PlayerStats } from './Player';

export { Pickup, type PickupConfig } from './Pickup';

export { Weapon, type FireResult, type WeaponEntityConfig } from './Weapon';
