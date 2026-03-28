/**
 * Effects system configuration.
 * All visual effect parameters: particle counts, sizes, durations, and pool settings.
 */

// ============ Death Particle Config ============

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
  /** Death particle settings */
  deathParticles: {
    /** Radius-based scaling: particle count and size scale with enemy radius */
    radiusScaling: {
      /** Particle count produced at the reference radius */
      baseCount: 6,
      /** Particle size produced at the reference radius */
      baseSize: 4,
      /** Enemy radius that produces 1× scaling (BASIC enemy) */
      referenceRadius: 15,
      /** Scaling curve exponent applied to count, size, and speed (1 = linear, <1 = sub-linear) */
      scalingExponent: 0.65,
    },

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
      speedMin: 100, // px/s
      speedMax: 380, // px/s
      sizeVarianceMin: 0.5,
      sizeVarianceMax: 1,
      decayMin: 1.1, // life drain per second
      decayMax: 2.4, // life drain per second
      angleJitter: 0.6,
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
