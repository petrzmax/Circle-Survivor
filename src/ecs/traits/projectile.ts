/**
 * Projectile-specific ECS trait — AoS callback-based for complex data.
 */

import { trait } from 'koota';
import { ProjectileType } from '@/types/enums';
import type { ExplosiveComponent, PierceComponent } from '@/entities/Projectile';
import type { Vector2 } from '@/utils';

/** Projectile-specific data */
export const ProjectileData = trait(() => ({
  type: ProjectileType.STANDARD,
  ownerId: -1,
  color: '#ffff00',
  distanceTraveled: 0,
  maxDistance: 0,
  isCrit: false,
  weaponCategory: 'gun',
  explosiveRange: 0,
  baseSpeed: 0,
  shouldExplodeOnExpire: false,
  spawnPosition: { x: 0, y: 0 } as Vector2,

  // Optional components
  explosive: null as ExplosiveComponent | null,
  pierce: null as PierceComponent | null,

  // Special behaviors
  rotation: 0,
  rotationSpeed: 0,
  returnToOwner: false,
  isReturning: false,
}));
