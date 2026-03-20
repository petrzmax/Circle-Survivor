/**
 * Projectile entity — config and component interfaces.
 */

import { EntityConfig, IExplosive } from '@/types/common';
import { ProjectileType, VisualEffect } from '@/types/enums';

/**
 * Explosive component data
 */
export interface ExplosiveComponent extends IExplosive {
  visualEffect: VisualEffect;
  /** Weapon-level damage multiplier — propagated to sub-munitions (e.g. mini bananas) */
  weaponLevelDamageMultiplier?: number;
  /** Weapon-level explosion radius multiplier — propagated to sub-munitions */
  weaponLevelExplosionMultiplier?: number;
}

/**
 * Pierce component data with tracking
 */
export interface PierceComponent {
  pierceCount: number;
  /** Set of enemy IDs already hit (prevents double-hit) */
  hitEnemies: Set<number>;
}

/**
 * Projectile configuration
 */
export interface ProjectileConfig extends EntityConfig {
  type: ProjectileType;
  damage: number;
  ownerId: number;
  color?: string;
  /** Projectile mass — set on PhysicsBody for momentum-based knockback. */
  mass?: number;

  // Lifetime
  maxDistance?: number;
  lifetime?: number;

  // Optional components
  explosive?: ExplosiveComponent;
  pierce?: PierceComponent;

  // Special behaviors
  rotation?: number;
  rotationSpeed?: number;
  returnToOwner?: boolean;

  // Grenade behavior
  weaponCategory?: string;
  explosiveRange?: number;
  bulletSpeed?: number;
  friction?: number;
}
