/**
 * Weapon type definitions.
 * Each weapon has unique stats and behavior.
 */

import { WeaponType, WeaponCategory, ProjectileType, DeployableType } from '@/types/enums';

/**
 * Weapon configuration interface
 */
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
  chain?: boolean;
  chainCount?: number;

  // Projectile/Deployable type mapping
  projectileType?: ProjectileType;
  deployableType?: DeployableType;
  explosiveRange?: number;
}

export const WEAPON_TYPES: Record<WeaponType | 'minibanana', WeaponConfig> = {
  [WeaponType.PISTOL]: {
    name: 'Pistolet',
    emoji: '🔫',
    fireRate: 500,
    damage: 10,
    bulletSpeed: 8,
    bulletCount: 1,
    spread: 0,
    price: 0,
    color: '#ffff00',
    range: 265,
    weaponCategory: WeaponCategory.GUN,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.SMG]: {
    name: 'SMG',
    emoji: '💨',
    fireRate: 150,
    damage: 5,
    bulletSpeed: 10,
    bulletCount: 1,
    spread: 15,
    price: 50,
    color: '#ffa500',
    range: 215,
    weaponCategory: WeaponCategory.GUN,
    knockbackMultiplier: 0.4,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.SHOTGUN]: {
    name: 'Shotgun',
    emoji: '💥',
    fireRate: 800,
    damage: 8,
    bulletSpeed: 7,
    bulletCount: 5,
    spread: 30,
    price: 80,
    color: '#ff4444',
    range: 140,
    weaponCategory: WeaponCategory.GUN,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.SNIPER]: {
    name: 'Snajperka',
    emoji: '🎯',
    fireRate: 1500,
    damage: 50,
    bulletSpeed: 15,
    bulletCount: 1,
    spread: 0,
    pierce: true,
    price: 100,
    color: '#00ffff',
    range: 400,
    weaponCategory: WeaponCategory.GUN,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.LASER]: {
    name: 'Laser',
    emoji: '⚡',
    fireRate: 100,
    damage: 3,
    bulletSpeed: 20,
    bulletCount: 1,
    spread: 5,
    price: 120,
    color: '#ff00ff',
    range: 350,
    weaponCategory: WeaponCategory.GUN,
    knockbackMultiplier: 0.15,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.MINIGUN]: {
    name: 'Minigun',
    emoji: '🔥',
    fireRate: 50,
    damage: 2,
    bulletSpeed: 12,
    bulletCount: 1,
    spread: 20,
    price: 220,
    color: '#ff6600',
    range: 160,
    knockbackMultiplier: 0.3,
    weaponCategory: WeaponCategory.GUN,
    projectileType: ProjectileType.STANDARD,
  },
  [WeaponType.BAZOOKA]: {
    name: 'Bazooka',
    emoji: '🚀',
    fireRate: 2000,
    damage: 80,
    bulletSpeed: 5,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 80,
    price: 180,
    color: '#ff0000',
    bulletRadius: 10,
    range: 310,
    weaponCategory: WeaponCategory.ROCKET,
    projectileType: ProjectileType.ROCKET,
  },
  [WeaponType.FLAMETHROWER]: {
    name: 'Miotacz Ognia',
    emoji: '🔥',
    fireRate: 80,
    damage: 2,
    bulletSpeed: 6,
    bulletCount: 3,
    spread: 40,
    price: 140,
    color: '#ff4400',
    bulletRadius: 6,
    shortRange: true,
    maxDistance: 120,
    range: 120,
    weaponCategory: WeaponCategory.SPECIAL,
    knockbackMultiplier: 0,
    projectileType: ProjectileType.FLAMETHROWER,
  },
  [WeaponType.MINES]: {
    name: 'Miny',
    emoji: '💣',
    fireRate: 4500,
    damage: 60,
    bulletSpeed: 0,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 70,
    price: 130,
    color: '#333333',
    bulletRadius: 12,
    range: 9999,
    weaponCategory: WeaponCategory.DEPLOYABLE,
    deployableType: DeployableType.MINE,
  },
  [WeaponType.NUKE]: {
    name: 'Wyrzutnia Nuklearna',
    emoji: '☢️',
    fireRate: 8000,
    damage: 300,
    bulletSpeed: 3,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 200,
    price: 500,
    color: '#00ff00',
    bulletRadius: 15,
    range: 9999,
    weaponCategory: WeaponCategory.ROCKET,
    projectileType: ProjectileType.NUKE,
  },
  [WeaponType.SCYTHE]: {
    name: 'Kosa Kubusia',
    emoji: '🌙',
    fireRate: 1200,
    damage: 35,
    bulletSpeed: 6,
    bulletCount: 1,
    spread: 0,
    pierce: true,
    pierceCount: 10,
    price: 200,
    color: '#9932cc',
    bulletRadius: 20,
    range: 230,
    weaponCategory: WeaponCategory.MELEE,
    projectileType: ProjectileType.SCYTHE,
  },
  [WeaponType.SWORD]: {
    name: 'Miecz Kamilka',
    emoji: '⚔️',
    fireRate: 700,
    damage: 10,
    bulletSpeed: 12,
    bulletCount: 3,
    spread: 60,
    price: 180,
    color: '#c0c0c0',
    bulletRadius: 8,
    shortRange: true,
    maxDistance: 100,
    range: 100,
    weaponCategory: WeaponCategory.MELEE,
    knockbackMultiplier: 0.3,
    projectileType: ProjectileType.SWORD,
  },
  [WeaponType.HOLY_GRENADE]: {
    name: 'Święty Granat',
    emoji: '✝️',
    fireRate: 3000,
    damage: 150,
    bulletSpeed: 4,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 120,
    price: 250,
    color: '#ffd700',
    bulletRadius: 12,
    range: 275,
    weaponCategory: WeaponCategory.GRENADE,
    explosiveRange: 275,
    projectileType: ProjectileType.HOLY_GRENADE,
  },
  [WeaponType.BANANA]: {
    name: 'Banan z Worms',
    emoji: '🍌',
    fireRate: 2500,
    damage: 40,
    bulletSpeed: 5,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 90,
    price: 220,
    color: '#ffff00',
    bulletRadius: 10,
    range: 235,
    weaponCategory: WeaponCategory.GRENADE,
    explosiveRange: 235,
    projectileType: ProjectileType.BANANA,
  },
  [WeaponType.CROSSBOW]: {
    name: 'Kusza Przebijająca',
    emoji: '🏹',
    fireRate: 1000,
    damage: 60,
    bulletSpeed: 14,
    bulletCount: 1,
    spread: 0,
    pierce: true,
    pierceCount: 5,
    price: 280,
    color: '#8b4513',
    bulletRadius: 6,
    range: 320,
    weaponCategory: WeaponCategory.GUN,
    projectileType: ProjectileType.CROSSBOW_BOLT,
  },

  // Internal type - mini banana spawned by main banana
  minibanana: {
    name: 'Mini Banan',
    emoji: '🍌',
    fireRate: 0,
    damage: 16,
    bulletSpeed: 8,
    bulletCount: 1,
    spread: 0,
    explosive: true,
    explosionRadius: 45,
    price: 0,
    color: '#ffff00',
    bulletRadius: 6,
    range: 80,
    weaponCategory: WeaponCategory.GRENADE,
    explosiveRange: 80,
    projectileType: ProjectileType.MINI_BANANA,
  },
} as const;
