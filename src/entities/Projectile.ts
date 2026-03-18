/**
 * Projectile entity — config and component interfaces.
 */

import { IExplosive } from '@/types/common';
import { VisualEffect } from '@/types/enums';
import { EntityConfig } from '@/types/common';
import { ProjectileType } from '@/types/enums';

/**
 * Explosive component data
 */
export interface ExplosiveComponent extends IExplosive {
  visualEffect: VisualEffect;
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
  rotationSpeed?: number;
  returnToOwner?: boolean;

  // Grenade behavior
  weaponCategory?: string;
  explosiveRange?: number;
  bulletSpeed?: number;
  friction?: number;
}
