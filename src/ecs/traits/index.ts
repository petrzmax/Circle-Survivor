/**
 * Re-exports all ECS traits.
 */

// Shared SoA traits
export {
  Position,
  Velocity,
  Collider,
  Health,
  Damage,
  Lifetime,
  Explosive,
  DropsPickup,
  PhysicsBody,
} from './shared';

// Tag traits
export {
  IsPlayer,
  IsEnemy,
  IsProjectile,
  IsPickup,
  IsDeployable,
  IsBoss,
  IsDead,
  IsArmed,
  IsAttracted,
  IsPlayerOwned,
  IsEnemyOwned,
  ArenaBound,
} from './tags';

// Per-type AoS traits
export { PlayerStats, PlayerCharacter, WeaponInventory } from './player';
export { EnemyData } from './enemy';
export { ProjectileData } from './projectile';
export { PickupData } from './pickup';
export { DeployableData } from './deployable';
