import { Deployable, Projectile } from '@/entities';
import { DeployableType, ProjectileType, WeaponCategory, WeaponType } from '@/types';

export interface WeaponConfig {
  name: string;
  emoji: string;
  fireRate: number;
  damage: number;
  bulletSpeed: number;
  bulletCount: number;
  spread: number;
  price: number;
  color: string;
  range: number;
  weaponCategory: WeaponCategory;

  // Optional properties
  pierce?: boolean;
  pierceCount?: number;
  explosive?: boolean;
  explosionRadius?: number;
  bulletRadius?: number;
  knockbackMultiplier?: number;
  shortRange?: boolean;
  maxDistance?: number;

  // Projectile/Deployable type mapping
  projectileType?: ProjectileType;
  deployableType?: DeployableType;
  explosiveRange?: number;

  // Projectile behavior
  rotationSpeed?: number; // radians per second
}

export interface WeaponInstance {
  type: WeaponType;
  config: WeaponConfig;
  level: number;
  lastFireTime: number;
  multishot: number;
  name: string;
  fireOffset: number; // Staggered shooting offset
}
export interface FireResult {
  projectiles: Projectile[];
  deployables: Deployable[];
}

export interface WeaponEntityConfig {
  type: WeaponType;
  /** Fire offset for staggered shooting (milliseconds) */
  fireOffset?: number;
}
