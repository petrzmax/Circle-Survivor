/**
 * Effects system configuration.
 * All visual effect parameters: particle counts, sizes, durations, and pool settings.
 */

import { EnemyType } from '@/types/enums';

// ============ Death Particle Config ============

export interface DeathParticlePreset {
  particleCount: number;
  particleSize: number;
}

/** Boss second-wave golden particle settings */
export interface BossGoldenParticleConfig {
  count: number;
  sizeMin: number;
  sizeMax: number;
  color: string;
  decay: number;
  speedMin: number;
  speedMax: number;
}

// ============ Effects Config ============

export const EFFECTS_CONFIG = {
  /** Death particle presets by enemy type */
  deathParticles: {
    /** Default preset for enemy types not listed below */
    default: {
      particleCount: 8,
      particleSize: 4,
    } satisfies DeathParticlePreset,

    /** Per-type overrides */
    presets: {
      [EnemyType.SWARM]: { particleCount: 5, particleSize: 3 },
      [EnemyType.TANK]: { particleCount: 15, particleSize: 6 },
      [EnemyType.BRUTE]: { particleCount: 15, particleSize: 6 },
    } as Partial<Record<EnemyType, DeathParticlePreset>>,

    /** Boss primary particle burst */
    boss: {
      particleCount: 30,
      particleSize: 8,
    } satisfies DeathParticlePreset,

    /** Boss secondary golden particle burst */
    bossGolden: {
      count: 20,
      sizeMin: 10,
      sizeMax: 20,
      color: '#FFD700',
      decay: 0.6, // per second
      speedMin: 60, // px/s
      speedMax: 180, // px/s
    } satisfies BossGoldenParticleConfig,

    /** Particle physics (all values in per-second units) */
    physics: {
      speedMin: 120, // px/s
      speedMax: 360, // px/s
      sizeVarianceMin: 0.5,
      sizeVarianceMax: 1,
      decayMin: 1.2, // life drain per second
      decayMax: 2.4, // life drain per second
      angleJitter: 0.5,
      friction: 0.0461, // retention per second (0.95^60)
    },
  },

  /** Explosion visual durations (ms) */
  explosions: {
    standardDuration: 300,
    nukeDuration: 600,
  },

  /** Shockwave visual settings */
  shockwaves: {
    duration: 400,
    /** Fraction of duration over which radius expands to max */
    expansionFactor: 0.7,
    /** Ring hit detection width (pixels) */
    ringWidth: 30,
  },

  /** Object pool configuration */
  pool: {
    /** Initial pre-allocated explosion objects */
    initialExplosions: 50,
    /** Initial pre-allocated death particle objects */
    initialDeathParticles: 500,
    /** Maximum active death particles (skip spawning when exceeded) */
    maxDeathParticles: 2000,
    /** Maximum active explosions */
    maxExplosions: 200,
  },
} as const;

export type EffectsConfig = typeof EFFECTS_CONFIG;
