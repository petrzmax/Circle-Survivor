import { Deployable, Projectile } from '@/entities';
import { DeployableType, ProjectileType, VisualEffect } from '@/types';

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
  pierceCount?: number;
  explosive?: boolean;
  explosionRadius?: number;
  explosionEffect?: VisualEffect;
  bulletRadius?: number;
  knockbackMultiplier?: number;
  // TODO analyse if it's still needed
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

export enum WeaponType {
  PISTOL = 'pistol',
  SMG = 'smg',
  SHOTGUN = 'shotgun',
  SNIPER = 'sniper',
  LASER = 'laser',
  MINIGUN = 'minigun',
  BAZOOKA = 'bazooka',
  FLAMETHROWER = 'flamethrower',
  MINES = 'mines',
  NUKE = 'nuke',
  SCYTHE = 'scythe',
  SWORD = 'sword',
  HOLY_GRENADE = 'holyGrenade',
  BANANA = 'banana',
  CROSSBOW = 'crossbow',
}

/**
 * Weapon categories for behavior grouping
 */
export enum WeaponCategory {
  GUN = 'gun',
  ROCKET = 'rocket',
  SPECIAL = 'special',
  MELEE = 'melee',
  GRENADE = 'grenade',
  DEPLOYABLE = 'deployable',
}
