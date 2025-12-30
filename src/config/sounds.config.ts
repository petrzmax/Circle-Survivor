/**
 * Sound definitions for AudioSystem.
 * All game sounds are defined here as data - AudioSystem just plays them.
 *
 * Keys for weapon sounds MUST match WeaponType enum values!
 */

// ============ TYPES ============

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ToneDefinition {
  type: 'tone';
  frequency: number;
  duration: number;
  oscillator: OscillatorType;
  volume: number;
  delay?: number;
}

export interface NoiseDefinition {
  type: 'noise';
  duration: number;
  volume: number;
}

export type SoundStep = ToneDefinition | NoiseDefinition;

export interface SoundDefinition {
  steps: SoundStep[];
  /** Cooldown in ms - prevents sound spam */
  cooldown?: number;
}

// ============ SOUND DEFINITIONS ============

export const SOUND_DEFINITIONS: Record<string, SoundDefinition> = {
  // ========== Weapon Sounds (keys = WeaponType values) ==========

  pistol: {
    steps: [{ type: 'tone', frequency: 800, duration: 0.05, oscillator: 'square', volume: 0.3 }],
  },

  smg: {
    steps: [{ type: 'tone', frequency: 700, duration: 0.03, oscillator: 'square', volume: 0.2 }],
  },

  shotgun: {
    steps: [
      { type: 'noise', duration: 0.1, volume: 0.4 },
      { type: 'tone', frequency: 200, duration: 0.08, oscillator: 'sawtooth', volume: 0.3 },
    ],
  },

  sniper: {
    steps: [
      { type: 'tone', frequency: 150, duration: 0.15, oscillator: 'sawtooth', volume: 0.5 },
      { type: 'tone', frequency: 100, duration: 0.2, oscillator: 'sine', volume: 0.3 },
    ],
  },

  laser: {
    steps: [{ type: 'tone', frequency: 1200, duration: 0.03, oscillator: 'sine', volume: 0.2 }],
  },

  minigun: {
    steps: [{ type: 'tone', frequency: 600, duration: 0.02, oscillator: 'square', volume: 0.15 }],
  },

  bazooka: {
    steps: [
      { type: 'noise', duration: 0.15, volume: 0.3 },
      { type: 'tone', frequency: 100, duration: 0.2, oscillator: 'sawtooth', volume: 0.4 },
    ],
  },

  flamethrower: {
    steps: [{ type: 'noise', duration: 0.05, volume: 0.2 }],
  },

  mines: {
    steps: [
      { type: 'tone', frequency: 300, duration: 0.08, oscillator: 'square', volume: 0.25 },
      { type: 'tone', frequency: 200, duration: 0.1, oscillator: 'triangle', volume: 0.2 },
    ],
  },

  nuke: {
    steps: [
      { type: 'noise', duration: 0.15, volume: 0.3 },
      { type: 'tone', frequency: 100, duration: 0.2, oscillator: 'sawtooth', volume: 0.4 },
    ],
  },

  scythe: {
    steps: [
      { type: 'tone', frequency: 400, duration: 0.1, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 300, duration: 0.1, oscillator: 'sine', volume: 0.2, delay: 50 },
    ],
  },

  sword: {
    steps: [
      { type: 'tone', frequency: 500, duration: 0.08, oscillator: 'sawtooth', volume: 0.4 },
      { type: 'noise', duration: 0.05, volume: 0.2 },
    ],
  },

  holyGrenade: {
    steps: [
      { type: 'tone', frequency: 800, duration: 0.1, oscillator: 'triangle', volume: 0.3 },
      { type: 'tone', frequency: 1000, duration: 0.08, oscillator: 'sine', volume: 0.25 },
    ],
  },

  banana: {
    steps: [
      { type: 'tone', frequency: 500, duration: 0.1, oscillator: 'sine', volume: 0.25 },
      { type: 'tone', frequency: 450, duration: 0.08, oscillator: 'sine', volume: 0.2, delay: 80 },
    ],
  },

  crossbow: {
    steps: [{ type: 'tone', frequency: 250, duration: 0.1, oscillator: 'triangle', volume: 0.4 }],
  },

  // ========== Explosion Sounds ==========

  explosion: {
    steps: [
      { type: 'noise', duration: 0.3, volume: 0.6 },
      { type: 'tone', frequency: 80, duration: 0.3, oscillator: 'sine', volume: 0.5 },
    ],
    cooldown: 20,
  },

  nukeExplosion: {
    steps: [
      { type: 'noise', duration: 0.8, volume: 1 },
      { type: 'tone', frequency: 40, duration: 0.5, oscillator: 'sine', volume: 0.8 },
      { type: 'tone', frequency: 60, duration: 0.4, oscillator: 'sine', volume: 0.5, delay: 100 },
      { type: 'tone', frequency: 50, duration: 0.3, oscillator: 'sine', volume: 0.3, delay: 200 },
    ],
  },

  holyExplosion: {
    steps: [
      { type: 'tone', frequency: 600, duration: 0.2, oscillator: 'sine', volume: 0.4 },
      { type: 'noise', duration: 0.4, volume: 0.5 },
      { type: 'tone', frequency: 800, duration: 0.15, oscillator: 'sine', volume: 0.3, delay: 100 },
    ],
  },

  mineExplosion: {
    steps: [
      { type: 'noise', duration: 0.25, volume: 0.5 },
      { type: 'tone', frequency: 100, duration: 0.25, oscillator: 'sine', volume: 0.4 },
    ],
  },

  // ========== Collection Sounds ==========

  collectGold: {
    steps: [
      { type: 'tone', frequency: 800, duration: 0.05, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 1000, duration: 0.05, oscillator: 'sine', volume: 0.3 },
    ],
    cooldown: 20,
  },

  collectXP: {
    steps: [{ type: 'tone', frequency: 600, duration: 0.08, oscillator: 'triangle', volume: 0.2 }],
  },

  collectHealth: {
    steps: [
      { type: 'tone', frequency: 400, duration: 0.1, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 600, duration: 0.1, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 800, duration: 0.15, oscillator: 'sine', volume: 0.3 },
    ],
    cooldown: 50,
  },

  // ========== Combat Sounds (with cooldown for anti-spam) ==========

  playerHit: {
    steps: [
      { type: 'tone', frequency: 200, duration: 0.1, oscillator: 'sawtooth', volume: 0.4 },
      { type: 'tone', frequency: 150, duration: 0.15, oscillator: 'square', volume: 0.3 },
    ],
    cooldown: 100,
  },

  enemyHit: {
    steps: [{ type: 'tone', frequency: 300, duration: 0.05, oscillator: 'square', volume: 0.2 }],
    cooldown: 50,
  },

  enemyDeath: {
    steps: [
      { type: 'tone', frequency: 200, duration: 0.1, oscillator: 'sawtooth', volume: 0.3 },
      { type: 'tone', frequency: 100, duration: 0.15, oscillator: 'sawtooth', volume: 0.2 },
    ],
    cooldown: 30,
  },

  dodge: {
    steps: [
      { type: 'tone', frequency: 1000, duration: 0.05, oscillator: 'sine', volume: 0.2 },
      { type: 'tone', frequency: 1200, duration: 0.05, oscillator: 'sine', volume: 0.15 },
    ],
  },

  thorns: {
    steps: [{ type: 'tone', frequency: 800, duration: 0.03, oscillator: 'square', volume: 0.2 }],
    cooldown: 80,
  },

  // ========== UI Sounds ==========

  purchase: {
    steps: [
      { type: 'tone', frequency: 500, duration: 0.05, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 700, duration: 0.05, oscillator: 'sine', volume: 0.3 },
      { type: 'tone', frequency: 900, duration: 0.1, oscillator: 'sine', volume: 0.4 },
    ],
  },

  error: {
    steps: [
      { type: 'tone', frequency: 200, duration: 0.1, oscillator: 'square', volume: 0.3 },
      { type: 'tone', frequency: 150, duration: 0.15, oscillator: 'square', volume: 0.3 },
    ],
  },

  waveStart: {
    steps: [
      { type: 'tone', frequency: 400, duration: 0.1, oscillator: 'triangle', volume: 0.3 },
      { type: 'tone', frequency: 500, duration: 0.1, oscillator: 'triangle', volume: 0.3 },
      { type: 'tone', frequency: 600, duration: 0.15, oscillator: 'triangle', volume: 0.4 },
    ],
  },

  bossSpawn: {
    steps: [
      { type: 'tone', frequency: 100, duration: 0.3, oscillator: 'sawtooth', volume: 0.5 },
      { type: 'tone', frequency: 80, duration: 0.4, oscillator: 'sawtooth', volume: 0.4 },
      { type: 'tone', frequency: 60, duration: 0.5, oscillator: 'sawtooth', volume: 0.3 },
    ],
  },

  gameOver: {
    steps: [
      { type: 'tone', frequency: 400, duration: 0.2, oscillator: 'sawtooth', volume: 0.4 },
      {
        type: 'tone',
        frequency: 300,
        duration: 0.2,
        oscillator: 'sawtooth',
        volume: 0.4,
        delay: 150,
      },
      {
        type: 'tone',
        frequency: 200,
        duration: 0.3,
        oscillator: 'sawtooth',
        volume: 0.4,
        delay: 300,
      },
      {
        type: 'tone',
        frequency: 100,
        duration: 0.5,
        oscillator: 'sawtooth',
        volume: 0.5,
        delay: 450,
      },
    ],
  },

  // ========== Countdown Sounds ==========

  countdownTick_3: {
    steps: [
      { type: 'tone', frequency: 300, duration: 0.08, oscillator: 'square', volume: 0.25 },
      { type: 'tone', frequency: 350, duration: 0.06, oscillator: 'sawtooth', volume: 0.15 },
    ],
  },

  countdownTick_2: {
    steps: [
      { type: 'tone', frequency: 300, duration: 0.08, oscillator: 'square', volume: 0.25 },
      { type: 'tone', frequency: 350, duration: 0.06, oscillator: 'sawtooth', volume: 0.15 },
    ],
  },

  countdownTick_1: {
    steps: [
      { type: 'tone', frequency: 300, duration: 0.08, oscillator: 'square', volume: 0.25 },
      { type: 'tone', frequency: 350, duration: 0.06, oscillator: 'sawtooth', volume: 0.15 },
    ],
  },

  countdownTick_0: {
    steps: [
      { type: 'tone', frequency: 500, duration: 0.08, oscillator: 'triangle', volume: 0.3 },
      {
        type: 'tone',
        frequency: 600,
        duration: 0.1,
        oscillator: 'triangle',
        volume: 0.35,
        delay: 100,
      },
    ],
  },
};
