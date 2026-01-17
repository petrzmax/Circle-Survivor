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

/**
 * Extend Window interface to include webkit prefixed AudioContext
 */
export interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}
