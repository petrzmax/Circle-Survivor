/**
 * Wave composition configuration.
 * Defines which enemy types appear at each wave and their relative spawn weights.
 *
 * Each entry maps a wave number to an array of { type, weight } pairs.
 * Weights are relative (auto-normalized by weightedRandom), so they don't need to sum to 1.
 * The highest defined wave is used as fallback for all subsequent waves.
 */

import { EnemyType } from '@/types/enums';

export interface WaveEnemyEntry {
  type: EnemyType;
  weight: number;
}

export const WAVE_COMPOSITION: Record<number, WaveEnemyEntry[]> = {
  1: [{ type: EnemyType.BASIC, weight: 1 }],
  2: [
    { type: EnemyType.BASIC, weight: 0.6 },
    { type: EnemyType.FAST, weight: 0.4 },
  ],
  3: [
    { type: EnemyType.BASIC, weight: 0.4 },
    { type: EnemyType.FAST, weight: 0.3 },
    { type: EnemyType.SWARM, weight: 0.3 },
  ],
  4: [
    { type: EnemyType.BASIC, weight: 0.3 },
    { type: EnemyType.FAST, weight: 0.2 },
    { type: EnemyType.SWARM, weight: 0.25 },
    { type: EnemyType.TANK, weight: 0.25 },
  ],
  5: [
    { type: EnemyType.BASIC, weight: 0.25 },
    { type: EnemyType.FAST, weight: 0.15 },
    { type: EnemyType.SWARM, weight: 0.2 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.3 },
  ],
  6: [
    { type: EnemyType.BASIC, weight: 0.2 },
    { type: EnemyType.FAST, weight: 0.15 },
    { type: EnemyType.SWARM, weight: 0.15 },
    { type: EnemyType.TANK, weight: 0.15 },
    { type: EnemyType.ZIGZAG, weight: 0.15 },
    { type: EnemyType.SPRINTER, weight: 0.2 },
  ],
  7: [
    { type: EnemyType.BASIC, weight: 0.15 },
    { type: EnemyType.FAST, weight: 0.15 },
    { type: EnemyType.SWARM, weight: 0.15 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.15 },
    { type: EnemyType.SPRINTER, weight: 0.15 },
    { type: EnemyType.EXPLODER, weight: 0.15 },
  ],
  8: [
    { type: EnemyType.BASIC, weight: 0.1 },
    { type: EnemyType.FAST, weight: 0.1 },
    { type: EnemyType.SWARM, weight: 0.15 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.15 },
    { type: EnemyType.SPRINTER, weight: 0.15 },
    { type: EnemyType.EXPLODER, weight: 0.12 },
    { type: EnemyType.GHOST, weight: 0.13 },
  ],
  9: [
    { type: EnemyType.BASIC, weight: 0.1 },
    { type: EnemyType.FAST, weight: 0.1 },
    { type: EnemyType.SWARM, weight: 0.15 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.1 },
    { type: EnemyType.SPRINTER, weight: 0.1 },
    { type: EnemyType.EXPLODER, weight: 0.1 },
    { type: EnemyType.GHOST, weight: 0.12 },
    { type: EnemyType.SPLITTER, weight: 0.13 },
  ],
  10: [
    { type: EnemyType.BASIC, weight: 0.08 },
    { type: EnemyType.FAST, weight: 0.08 },
    { type: EnemyType.SWARM, weight: 0.12 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.1 },
    { type: EnemyType.SPRINTER, weight: 0.1 },
    { type: EnemyType.EXPLODER, weight: 0.1 },
    { type: EnemyType.GHOST, weight: 0.1 },
    { type: EnemyType.SPLITTER, weight: 0.1 },
    { type: EnemyType.STOMPER, weight: 0.12 },
  ],
  // Wave 11+: all types including BRUTE (used as fallback for all higher waves)
  11: [
    { type: EnemyType.BASIC, weight: 0.07 },
    { type: EnemyType.FAST, weight: 0.07 },
    { type: EnemyType.SWARM, weight: 0.1 },
    { type: EnemyType.TANK, weight: 0.1 },
    { type: EnemyType.ZIGZAG, weight: 0.1 },
    { type: EnemyType.SPRINTER, weight: 0.1 },
    { type: EnemyType.EXPLODER, weight: 0.1 },
    { type: EnemyType.GHOST, weight: 0.1 },
    { type: EnemyType.SPLITTER, weight: 0.08 },
    { type: EnemyType.STOMPER, weight: 0.1 },
    { type: EnemyType.BRUTE, weight: 0.08 },
  ],
};

export const MAX_DEFINED_WAVE = Math.max(...Object.keys(WAVE_COMPOSITION).map(Number));

/** Boss rotation order. Cycles after all bosses have been used. */
export const BOSS_ROTATION: EnemyType[] = [
  EnemyType.BOSS,
  EnemyType.BOSS_SWARM,
  EnemyType.BOSS_TANK,
  EnemyType.BOSS_SPEED,
  EnemyType.BOSS_EXPLODER,
  EnemyType.BOSS_GHOST,
];
