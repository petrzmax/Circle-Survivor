/**
 * AudioSystem - Programmatic sound generation using Web Audio API.
 * Generates all game sounds procedurally without external audio files.
 */

import { EventBus } from '@/core/EventBus';

/**
 * Oscillator types for tone generation
 */
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/**
 * Sound categories for volume control
 */
export enum SoundCategory {
  SFX = 'sfx',
  UI = 'ui',
  MUSIC = 'music',
}

/**
 * AudioSystem configuration
 */
export interface AudioSystemConfig {
  /** Master volume (0-1) */
  volume?: number;
  /** Whether audio is enabled */
  enabled?: boolean;
  /** Auto-initialize on first sound */
  autoInit?: boolean;
}

/**
 * Handles all game audio using Web Audio API.
 * Generates sounds procedurally (no external files needed).
 * 
 * @example
 * ```typescript
 * const audioSystem = new AudioSystem({ volume: 0.5 });
 * 
 * // Initialize after user interaction (required by browsers)
 * audioSystem.init();
 * 
 * // Play sounds
 * audioSystem.shoot();
 * audioSystem.explosion();
 * audioSystem.collectGold();
 * ```
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean;
  private volume: number;
  private initialized: boolean = false;
  private autoInit: boolean;

  constructor(config: AudioSystemConfig = {}) {
    this.volume = config.volume ?? 0.3;
    this.enabled = config.enabled ?? true;
    this.autoInit = config.autoInit ?? true;
  }

  /**
   * Initialize the audio context.
   * Must be called after user interaction (browser requirement).
   */
  init(): boolean {
    if (this.initialized) return true;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[AudioSystem] Web Audio API not supported');
        this.enabled = false;
        return false;
      }
      
      this.ctx = new AudioContextClass();
      this.initialized = true;
      return true;
    } catch (e) {
      console.warn('[AudioSystem] Failed to initialize:', e);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Resume audio context (required after page becomes visible)
   */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ========== Core Sound Generation ==========

  /**
   * Play a tone with specified parameters
   */
  playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volumeMod: number = 1
  ): void {
    if (!this.enabled) return;
    if (!this.ctx && this.autoInit) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(this.volume * volumeMod, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play white noise (for explosions, etc.)
   */
  playNoise(duration: number, volumeMod: number = 1): void {
    if (!this.enabled) return;
    if (!this.ctx && this.autoInit) this.init();
    if (!this.ctx) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(this.volume * volumeMod, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Play a delayed tone
   */
  private playToneDelayed(
    frequency: number,
    duration: number,
    delay: number,
    type: OscillatorType = 'square',
    volumeMod: number = 1
  ): void {
    setTimeout(() => {
      this.playTone(frequency, duration, type, volumeMod);
    }, delay);
  }

  // ========== Weapon Sounds ==========

  /** Pistol shot */
  shoot(): void {
    this.playTone(800, 0.05, 'square', 0.3);
  }

  /** Shotgun blast */
  shootShotgun(): void {
    this.playNoise(0.1, 0.4);
    this.playTone(200, 0.08, 'sawtooth', 0.3);
  }

  /** Sniper shot */
  shootSniper(): void {
    this.playTone(150, 0.15, 'sawtooth', 0.5);
    this.playTone(100, 0.2, 'sine', 0.3);
  }

  /** Laser shot */
  shootLaser(): void {
    this.playTone(1200, 0.03, 'sine', 0.2);
  }

  /** Minigun shot */
  shootMinigun(): void {
    this.playTone(600, 0.02, 'square', 0.15);
  }

  /** SMG shot */
  shootSMG(): void {
    this.playTone(700, 0.03, 'square', 0.2);
  }

  /** Bazooka shot */
  shootBazooka(): void {
    this.playNoise(0.15, 0.3);
    this.playTone(100, 0.2, 'sawtooth', 0.4);
  }

  /** Crossbow shot */
  crossbowShoot(): void {
    this.playTone(250, 0.1, 'triangle', 0.4);
  }

  /** Chain lightning effect */
  chainEffect(): void {
    this.playTone(1500, 0.1, 'sine', 0.2);
  }

  /** Scythe swing */
  scytheSwing(): void {
    this.playTone(400, 0.1, 'sine', 0.3);
    this.playToneDelayed(300, 0.1, 50, 'sine', 0.2);
  }

  /** Sword slash */
  swordSlash(): void {
    this.playTone(500, 0.08, 'sawtooth', 0.4);
    this.playNoise(0.05, 0.2);
  }

  /** Flamethrower */
  flamethrower(): void {
    this.playNoise(0.05, 0.2);
  }

  /** Boomerang throw */
  boomerangThrow(): void {
    this.playTone(500, 0.1, 'sine', 0.25);
    this.playToneDelayed(450, 0.08, 80, 'sine', 0.2);
  }

  // ========== Explosion Sounds ==========

  /** Standard explosion */
  explosion(): void {
    this.playNoise(0.3, 0.6);
    this.playTone(80, 0.3, 'sine', 0.5);
  }

  /** Nuke explosion (bigger) */
  nukeExplosion(): void {
    this.playNoise(0.8, 1);
    this.playTone(40, 0.5, 'sine', 0.8);
    this.playToneDelayed(60, 0.4, 100, 'sine', 0.5);
    this.playToneDelayed(50, 0.3, 200, 'sine', 0.3);
  }

  /** Holy grenade explosion */
  holyExplosion(): void {
    this.playTone(600, 0.2, 'sine', 0.4);
    this.playNoise(0.4, 0.5);
    this.playToneDelayed(800, 0.15, 100, 'sine', 0.3);
  }

  /** Mine explosion */
  mineExplosion(): void {
    this.playNoise(0.25, 0.5);
    this.playTone(100, 0.25, 'sine', 0.4);
  }

  // ========== Collection Sounds ==========

  /** Collect gold */
  collectGold(): void {
    this.playTone(800, 0.05, 'sine', 0.3);
    this.playTone(1000, 0.05, 'sine', 0.3);
  }

  /** Collect XP */
  collectXP(): void {
    this.playTone(600, 0.08, 'triangle', 0.2);
  }

  /** Collect health */
  collectHealth(): void {
    this.playTone(400, 0.1, 'sine', 0.3);
    this.playTone(600, 0.1, 'sine', 0.3);
    this.playTone(800, 0.15, 'sine', 0.3);
  }

  // ========== Combat Sounds ==========

  /** Player takes damage */
  playerHit(): void {
    this.playTone(200, 0.1, 'sawtooth', 0.4);
    this.playTone(150, 0.15, 'square', 0.3);
  }

  /** Enemy takes damage */
  enemyHit(): void {
    this.playTone(300, 0.05, 'square', 0.2);
  }

  /** Enemy death */
  enemyDeath(): void {
    this.playTone(200, 0.1, 'sawtooth', 0.3);
    this.playTone(100, 0.15, 'sawtooth', 0.2);
  }

  /** Player dodges */
  dodge(): void {
    this.playTone(1000, 0.05, 'sine', 0.2);
    this.playTone(1200, 0.05, 'sine', 0.15);
  }

  /** Thorns damage */
  thorns(): void {
    this.playTone(800, 0.03, 'square', 0.2);
  }

  // ========== UI Sounds ==========

  /** Shop purchase */
  purchase(): void {
    this.playTone(500, 0.05, 'sine', 0.3);
    this.playTone(700, 0.05, 'sine', 0.3);
    this.playTone(900, 0.1, 'sine', 0.4);
  }

  /** Error (not enough gold, etc.) */
  error(): void {
    this.playTone(200, 0.1, 'square', 0.3);
    this.playTone(150, 0.15, 'square', 0.3);
  }

  /** Wave start */
  waveStart(): void {
    this.playTone(400, 0.1, 'triangle', 0.3);
    this.playTone(500, 0.1, 'triangle', 0.3);
    this.playTone(600, 0.15, 'triangle', 0.4);
  }

  /** Boss spawn */
  bossSpawn(): void {
    this.playTone(100, 0.3, 'sawtooth', 0.5);
    this.playTone(80, 0.4, 'sawtooth', 0.4);
    this.playTone(60, 0.5, 'sawtooth', 0.3);
  }

  /** Game over */
  gameOver(): void {
    this.playTone(400, 0.2, 'sawtooth', 0.4);
    this.playToneDelayed(300, 0.2, 150, 'sawtooth', 0.4);
    this.playToneDelayed(200, 0.3, 300, 'sawtooth', 0.4);
    this.playToneDelayed(100, 0.5, 450, 'sawtooth', 0.5);
  }

  /** Countdown tick */
  countdownTick(secondsLeft: number): void {
    if (secondsLeft === 0) {
      // Final sound - happy "ding ding!"
      this.playTone(500, 0.08, 'triangle', 0.3);
      this.playToneDelayed(600, 0.1, 100, 'triangle', 0.35);
    } else {
      // Warning blip
      this.playTone(300, 0.08, 'square', 0.25);
      this.playTone(350, 0.06, 'sawtooth', 0.15);
    }
  }

  /** Button hover */
  buttonHover(): void {
    this.playTone(400, 0.02, 'sine', 0.1);
  }

  /** Button click */
  buttonClick(): void {
    this.playTone(500, 0.03, 'sine', 0.2);
  }

  // ========== Settings ==========

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get master volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if audio is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Toggle audio on/off
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Connect to EventBus for automatic sound playback
   */
  connectToEventBus(): void {
    EventBus.on('goldCollected', () => this.collectGold());
    EventBus.on('healthCollected', () => this.collectHealth());
    EventBus.on('playerHit', () => this.playerHit());
    EventBus.on('enemyDamaged', () => this.enemyHit());
    EventBus.on('enemyDeath', () => this.enemyDeath());
    EventBus.on('waveStart', () => this.waveStart());
    EventBus.on('bossSpawned', () => this.bossSpawn());
    EventBus.on('itemPurchased', () => this.purchase());
    EventBus.on('weaponPurchased', () => this.purchase());
    EventBus.on('gameOver', () => this.gameOver());
    EventBus.on('explosionTriggered', (data) => {
      if (data.visualEffect === 'nuke') {
        this.nukeExplosion();
      } else if (data.visualEffect === 'holy') {
        this.holyExplosion();
      } else {
        this.explosion();
      }
    });
  }
}

/**
 * Global audio system instance (for backwards compatibility)
 */
export const audio = new AudioSystem();
