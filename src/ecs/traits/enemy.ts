/**
 * Enemy-specific ECS trait — AoS callback-based for complex data.
 */

import { trait } from 'koota';
import { EnemyType } from '@/types/enums';
import type { AttackPattern, EnemyConfig } from '@/domain/enemies/type';

/** Enemy-specific data (type, behavior flags, shooting, etc.) */
export const EnemyData = trait(() => ({
  type: EnemyType.BASIC,
  config: null as EnemyConfig | null,
  color: '#ff0000',
  speed: 60,
  xpValue: 10,
  goldValue: 1,
  scale: 1,

  // Special properties
  bossName: null as string | null,
  hasTopHealthBar: false,
  phasing: false,
  zigzag: false,

  // Death effects
  explodeOnDeath: false,
  explosionRadius: 0,
  explosionDamage: 0,
  splitOnDeath: false,
  splitCount: 0,

  // Shooting
  canShoot: false,
  fireRate: 2000,
  bulletSpeed: 240,
  bulletDamage: 15,
  attackPatterns: ['single'] as AttackPattern[],
  nextFireTime: 0,

  // Movement state
  zigzagTimer: 0,
  zigzagDir: 1,
  hasEnteredArena: false,
}));
