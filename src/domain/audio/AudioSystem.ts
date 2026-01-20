/**
 * AudioSystem - Programmatic sound generation using Web Audio API.
 * Generates all game sounds procedurally without external audio files.
 *
 * Sound definitions are in sounds.config.ts - this class only plays them.
 */

import { EventBus } from '@/core/EventBus';
import { SOUND_DEFINITIONS } from '@/domain/audio/config';
import { VisualEffect } from '@/types';
import { randomRange } from '@/utils';
import { SoundStep, WindowWithWebkit } from './type';

/**
 * Handles all game audio using Web Audio API.
 * Generates sounds procedurally (no external files needed).
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastPlayedAt = new Map<string, number>();

  public constructor() {
    this.init();
    this.connectToEventBus();
  }

  /**
   * Initialize the audio context.
   * Must be called after user interaction (browser requirement).
   */
  private init(): boolean {
    try {
      // Browser compatibility: Check for AudioContext or fallback to webkit prefix
      // In TypeScript strict mode with modern lib.dom, window.AudioContext is always defined,
      // but we still check for webkit fallback for older Safari browsers at runtime
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const AudioContextClass =
        window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;

      this.ctx = new AudioContextClass();
      return true;
    } catch (e) {
      console.warn('[AudioSystem] Failed to initialize:', e);
      this.enabled = false;
      return false;
    }
  }

  // ========== Core Sound Generation ==========

  /**
   * Play a tone with specified parameters
   */
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volumeMod: number = 1,
  ): void {
    if (!this.enabled || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(volumeMod, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Play white noise (for explosions, etc.)
   */
  private playNoise(duration: number, volumeMod: number = 1): void {
    if (!this.enabled || !this.ctx) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = randomRange(-1, 1);
    }

    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(volumeMod, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Play a sound step (tone or noise), with optional delay
   */
  private playStep(step: SoundStep): void {
    const playFn = (): void => {
      if (step.type === 'tone') {
        this.playTone(step.frequency, step.duration, step.oscillator, step.volume);
      } else {
        this.playNoise(step.duration, step.volume);
      }
    };

    if (step.type === 'tone' && step.delay) {
      setTimeout(playFn, step.delay);
    } else {
      playFn();
    }
  }

  // ========== Public API ==========

  /**
   * Play a sound by name from SOUND_DEFINITIONS.
   * Respects cooldown if defined in the sound definition.
   */
  public play(soundName: string): void {
    if (!this.enabled) return;

    const definition = SOUND_DEFINITIONS[soundName];
    if (!definition) {
      console.warn(`[AudioSystem] Unknown sound: ${soundName}`);
      return;
    }

    // Cooldown check
    if (definition.cooldown) {
      const now = performance.now();
      const lastPlayed = this.lastPlayedAt.get(soundName) ?? 0;
      if (now - lastPlayed < definition.cooldown) return;
      this.lastPlayedAt.set(soundName, now);
    }

    for (const step of definition.steps) {
      this.playStep(step);
    }
  }

  /**
   * Check if audio is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle audio on/off
   */
  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // ========== EventBus Integration ==========

  /**
   * Connect to EventBus for automatic sound playback.
   * All sounds are triggered through events - no direct method calls needed.
   */
  private connectToEventBus(): void {
    // TODO - refactor, not cool two events
    // Audio toggle from UI
    EventBus.on('audioToggleRequested', () => {
      this.toggle();
      EventBus.emit('audioStateChanged', { enabled: this.enabled });
    });

    // Pickups
    EventBus.on('goldCollected', () => {
      this.play('collectGold');
    });
    EventBus.on('healthCollected', () => {
      this.play('collectHealth');
    });

    // Combat
    EventBus.on('playerHit', () => {
      this.play('playerHit');
    });
    EventBus.on('enemyDamaged', () => {
      this.play('enemyHit');
    });
    EventBus.on('enemyDeath', () => {
      this.play('enemyDeath');
    });
    EventBus.on('playerDodged', () => {
      this.play('dodge');
    });
    EventBus.on('thornsTriggered', () => {
      this.play('thorns');
    });

    // Weapons - WeaponType value IS the sound key!
    EventBus.on('weaponFired', ({ weaponType }) => {
      this.play(weaponType);
    });

    // Wave & Boss
    EventBus.on('waveStart', () => {
      this.play('waveStart');
    });
    EventBus.on('bossSpawned', () => {
      this.play('bossSpawn');
    });

    // Shop
    EventBus.on('itemPurchased', () => {
      this.play('purchase');
    });
    EventBus.on('weaponPurchased', () => {
      this.play('purchase');
    });
    EventBus.on('weaponSold', () => {
      this.play('sell');
    });
    EventBus.on('shopError', () => {
      this.play('error');
    });

    // Game state
    EventBus.on('gameOver', () => {
      this.play('gameOver');
    });

    // Countdown
    EventBus.on('countdownTick', ({ seconds }) => {
      this.play(`countdownTick_${seconds}`);
    });

    // Explosions
    EventBus.on('explosionTriggered', (data) => {
      // TODO change enum string values to match sound names
      switch (data.visualEffect) {
        case VisualEffect.NUKE:
          this.play('nukeExplosion');
          break;
        case VisualEffect.HOLY:
          this.play('holyExplosion');
          break;
        default:
          this.play('explosion');
      }
    });
  }
}
