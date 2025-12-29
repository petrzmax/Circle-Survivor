/**
 * Enemy type definitions.
 * Each enemy has unique stats and behaviors.
 */

import { EnemyType } from '@/types/enums';
import { randomElement } from '@/utils/random';

// TODO extract name generation to separate file

/**
 * Boss name generator arrays
 */
export const BOSS_NAME_PREFIXES: readonly string[] = [
  'Bezlitosny',
  'Bogini',
  'Bóg',
  'Cesarz',
  'Cesarzowa',
  'Cień',
  'Ciotka',
  'Dominator',
  'Essa',
  'Gniew',
  'Imperator',
  'Imperatorka',
  'Kapłan',
  'Kieł',
  'Król',
  'Królowa',
  'Krwawy',
  'Krzyk',
  'Krzykaczka',
  'Książę',
  'Księżniczka',
  'Łowca',
  'Marcel',
  'Matka',
  'Miłośnik',
  'Mroczny',
  'Nadzorca',
  'Niszczyciel',
  'Obrońca',
  'Ojciec',
  'Opus',
  'Pan',
  'Płacz',
  'Pogromca',
  'Potężny',
  'Pożeracz',
  'Rzeźniczka',
  'Rzeźnik',
  'Sigma',
  'Starożytny',
  'Strach',
  'Strażnik',
  'Szalony',
  'Wdowa',
  'Wielki',
  'Władca',
  'Wujek',
  'Zabójca',
  'Zderzacz',
  'Złoty',
  'Zwiastun',
] as const;

export const BOSS_NAME_SUFFIXES: readonly string[] = [
  'Baagera',
  'Beliara',
  'Beredy',
  'Biznesu',
  'Burzy',
  'Chaosu',
  'Ciemności',
  'Cieni',
  'Dominatora',
  'Gromu',
  'Kamilka',
  'Kazika',
  'Koszmaru',
  'Krwi',
  'Krzysztofa',
  'Kubicy',
  'Matiego',
  'Kustosz',
  'Nocy',
  'Otchłani',
  'Piekła',
  'Podróżnika',
  'Popiołów',
  'Pożogi',
  'Radzimirskiego',
  'Śmierci',
  'Światła',
  'Wieczności',
  'Zagłady',
  'Zarazy',
  'Zniszczenia',
] as const;

/**
 * Generates a random boss name from prefix and suffix arrays
 */
export function generateBossName(): string {
  const prefix = randomElement(BOSS_NAME_PREFIXES);
  const suffix = randomElement(BOSS_NAME_SUFFIXES);
  return `${prefix} ${suffix}`;
}

/**
 * Attack pattern types for shooting enemies
 */
export type AttackPattern = 'single' | 'spread' | 'shockwave';

/**
 * Enemy configuration interface
 */
export interface EnemyConfig {
  color: string;
  radius: number;
  speed: number;
  hp: number;
  damage: number;
  xpValue: number;
  goldValue: number;

  // Optional behaviors
  isBoss?: boolean; // TODO
  canShoot?: boolean;
  fireRate?: number;
  bulletSpeed?: number;
  bulletDamage?: number;
  attackPatterns?: AttackPattern[];

  // Special abilities
  phasing?: boolean;
  explodeOnDeath?: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
  zigzag?: boolean;
  splitOnDeath?: boolean;
  splitCount?: number;
}

export const ENEMY_TYPES: Record<EnemyType, EnemyConfig> = {
  // ============ BASIC ENEMIES ============
  [EnemyType.BASIC]: {
    color: '#e94560',
    radius: 15,
    speed: 1.5,
    hp: 20,
    damage: 15,
    xpValue: 10,
    goldValue: 2,
  },
  [EnemyType.FAST]: {
    color: '#ff8c00',
    radius: 10,
    speed: 3.5,
    hp: 10,
    damage: 8,
    xpValue: 15,
    goldValue: 4,
  },
  [EnemyType.TANK]: {
    color: '#9b59b6',
    radius: 28,
    speed: 0.7,
    hp: 100,
    damage: 35,
    xpValue: 35,
    goldValue: 9,
    canShoot: true,
    fireRate: 3000,
    bulletSpeed: 3,
    bulletDamage: 15,
    attackPatterns: ['single'],
  },
  [EnemyType.SWARM]: {
    color: '#2ecc71',
    radius: 7,
    speed: 2.2,
    hp: 5,
    damage: 5,
    xpValue: 5,
    goldValue: 1,
  },

  // ============ ADVANCED ENEMIES ============
  [EnemyType.SPRINTER]: {
    color: '#00ffff',
    radius: 9,
    speed: 5,
    hp: 8,
    damage: 12,
    xpValue: 20,
    goldValue: 5,
  },
  [EnemyType.BRUTE]: {
    color: '#8b0000',
    radius: 35,
    speed: 0.5,
    hp: 200,
    damage: 60,
    xpValue: 60,
    goldValue: 15,
    canShoot: true,
    fireRate: 3000,
    bulletSpeed: 3,
    bulletDamage: 25,
    attackPatterns: ['single'],
  },
  [EnemyType.GHOST]: {
    color: 'rgba(255, 255, 255, 0.6)',
    radius: 14,
    speed: 2,
    hp: 15,
    damage: 20,
    xpValue: 25,
    goldValue: 6,
    phasing: true,
  },
  [EnemyType.EXPLODER]: {
    color: '#ffff00',
    radius: 12,
    speed: 1.8,
    hp: 25,
    damage: 5,
    xpValue: 20,
    goldValue: 5,
    explodeOnDeath: true,
    explosionRadius: 60,
    explosionDamage: 15,
  },
  [EnemyType.ZIGZAG]: {
    color: '#ff69b4',
    radius: 11,
    speed: 2.5,
    hp: 18,
    damage: 8,
    xpValue: 18,
    goldValue: 4,
    zigzag: true,
  },
  [EnemyType.SPLITTER]: {
    color: '#7cfc00',
    radius: 20,
    speed: 1.2,
    hp: 40,
    damage: 12,
    xpValue: 25,
    goldValue: 7,
    splitOnDeath: true,
    splitCount: 3,
  },

  // ============ BOSSES ============
  [EnemyType.BOSS]: {
    color: '#ff0000',
    radius: 50,
    speed: 0.5,
    hp: 750,
    damage: 50,
    xpValue: 200,
    goldValue: 50,
    isBoss: true,
    canShoot: true,
    fireRate: 1300,
    bulletSpeed: 4,
    bulletDamage: 20,
    attackPatterns: ['single', 'spread'],
  },
  [EnemyType.BOSS_SWARM]: {
    color: '#00ff00',
    radius: 45,
    speed: 0.8,
    hp: 600,
    damage: 30,
    xpValue: 250,
    goldValue: 60,
    isBoss: true,
    splitOnDeath: true,
    splitCount: 8,
    canShoot: true,
    fireRate: 1000,
    bulletSpeed: 5,
    bulletDamage: 10,
    attackPatterns: ['single', 'spread'],
  },
  [EnemyType.BOSS_TANK]: {
    color: '#8b00ff',
    radius: 65,
    speed: 0.3,
    hp: 1500,
    damage: 80,
    xpValue: 300,
    goldValue: 75,
    isBoss: true,
    canShoot: true,
    fireRate: 2000,
    bulletSpeed: 3,
    bulletDamage: 35,
    attackPatterns: ['single', 'shockwave'],
  },
  [EnemyType.BOSS_SPEED]: {
    color: '#00ffff',
    radius: 40,
    speed: 1.6,
    hp: 500,
    damage: 35,
    xpValue: 220,
    goldValue: 55,
    isBoss: true,
    zigzag: true,
    canShoot: true,
    fireRate: 550,
    bulletSpeed: 7,
    bulletDamage: 12,
    attackPatterns: ['single', 'spread'],
  },
  [EnemyType.BOSS_EXPLODER]: {
    color: '#ffff00',
    radius: 55,
    speed: 0.5,
    hp: 900,
    damage: 40,
    xpValue: 280,
    goldValue: 70,
    isBoss: true,
    explodeOnDeath: true,
    explosionRadius: 150,
    explosionDamage: 50,
    canShoot: true,
    fireRate: 1600,
    bulletSpeed: 4,
    bulletDamage: 25,
    attackPatterns: ['spread', 'shockwave'],
  },
  [EnemyType.BOSS_GHOST]: {
    color: 'rgba(255, 255, 255, 0.7)',
    radius: 48,
    speed: 0.7,
    hp: 700,
    damage: 45,
    xpValue: 260,
    goldValue: 65,
    isBoss: true,
    phasing: true,
    canShoot: true,
    fireRate: 1200,
    bulletSpeed: 5,
    bulletDamage: 18,
    attackPatterns: ['single', 'spread'],
  },
} as const;
