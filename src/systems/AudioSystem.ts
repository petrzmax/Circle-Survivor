/**
 * AudioSystem - Programmatic sound generation using Web Audio API.
 * Generates all game sounds procedurally without external audio files.
 */

import { EventBus } from '@/core/EventBus';

/**
 * Extend Window interface to include webkit prefixed AudioContext
 */
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Oscillator types for tone generation
 */
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/**
 * Handles all game audio using Web Audio API.
 * Generates sounds procedurally (no external files needed).
 *
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  public constructor() {
    this.init()
    this.connectToEventBus();
  }

  /**
   * Initialize the audio context.
   * Must be called after user interaction (browser requirement).
   */
  private init(): boolean {
    try {
      const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[AudioSystem] Web Audio API not supported');
        this.enabled = false;
        return false;
      }

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
    if (!this.enabled) return;
    if (!this.ctx) return;

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
    if (!this.enabled) return;
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
    gain.gain.setValueAtTime(volumeMod, now);
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
    volumeMod: number = 1,
  ): void {
    setTimeout(() => {
      this.playTone(frequency, duration, type, volumeMod);
    }, delay);
  }

  // ========== Weapon Sounds ==========

  /** Pistol shot */
  public shoot(): void {
    this.playTone(800, 0.05, 'square', 0.3);
  }

  /** Shotgun blast */
  public shootShotgun(): void {
    this.playNoise(0.1, 0.4);
    this.playTone(200, 0.08, 'sawtooth', 0.3);
  }

  /** Sniper shot */
  public shootSniper(): void {
    this.playTone(150, 0.15, 'sawtooth', 0.5);
    this.playTone(100, 0.2, 'sine', 0.3);
  }

  /** Laser shot */
  public shootLaser(): void {
    this.playTone(1200, 0.03, 'sine', 0.2);
  }

  /** Minigun shot */
  public shootMinigun(): void {
    this.playTone(600, 0.02, 'square', 0.15);
  }

  /** SMG shot */
  public shootSMG(): void {
    this.playTone(700, 0.03, 'square', 0.2);
  }

  /** Bazooka shot */
  public shootBazooka(): void {
    this.playNoise(0.15, 0.3);
    this.playTone(100, 0.2, 'sawtooth', 0.4);
  }

  /** Crossbow shot */
  public crossbowShoot(): void {
    this.playTone(250, 0.1, 'triangle', 0.4);
  }

  /** Chain lightning effect */
  public chainEffect(): void {
    this.playTone(1500, 0.1, 'sine', 0.2);
  }

  /** Scythe swing */
  public scytheSwing(): void {
    this.playTone(400, 0.1, 'sine', 0.3);
    this.playToneDelayed(300, 0.1, 50, 'sine', 0.2);
  }

  /** Sword slash */
  public swordSlash(): void {
    this.playTone(500, 0.08, 'sawtooth', 0.4);
    this.playNoise(0.05, 0.2);
  }

  /** Flamethrower */
  public flamethrower(): void {
    this.playNoise(0.05, 0.2);
  }

  /** Boomerang throw */
  public boomerangThrow(): void {
    this.playTone(500, 0.1, 'sine', 0.25);
    this.playToneDelayed(450, 0.08, 80, 'sine', 0.2);
  }

  // ========== Explosion Sounds ==========

  /** Standard explosion */
  public explosion(): void {
    this.playNoise(0.3, 0.6);
    this.playTone(80, 0.3, 'sine', 0.5);
  }

  /** Nuke explosion (bigger) */
  public nukeExplosion(): void {
    this.playNoise(0.8, 1);
    this.playTone(40, 0.5, 'sine', 0.8);
    this.playToneDelayed(60, 0.4, 100, 'sine', 0.5);
    this.playToneDelayed(50, 0.3, 200, 'sine', 0.3);
  }

  /** Holy grenade explosion */
  public holyExplosion(): void {
    this.playTone(600, 0.2, 'sine', 0.4);
    this.playNoise(0.4, 0.5);
    this.playToneDelayed(800, 0.15, 100, 'sine', 0.3);
  }

  /** Mine explosion */
  public mineExplosion(): void {
    this.playNoise(0.25, 0.5);
    this.playTone(100, 0.25, 'sine', 0.4);
  }

  // ========== Collection Sounds ==========

  /** Collect gold */
  public collectGold(): void {
    this.playTone(800, 0.05, 'sine', 0.3);
    this.playTone(1000, 0.05, 'sine', 0.3);
  }

  /** Collect XP */
  public collectXP(): void {
    this.playTone(600, 0.08, 'triangle', 0.2);
  }

  /** Collect health */
  public collectHealth(): void {
    this.playTone(400, 0.1, 'sine', 0.3);
    this.playTone(600, 0.1, 'sine', 0.3);
    this.playTone(800, 0.15, 'sine', 0.3);
  }

  // ========== Combat Sounds ==========

  /** Player takes damage */
  public playerHit(): void {
    this.playTone(200, 0.1, 'sawtooth', 0.4);
    this.playTone(150, 0.15, 'square', 0.3);
  }

  /** Enemy takes damage */
  public enemyHit(): void {
    this.playTone(300, 0.05, 'square', 0.2);
  }

  /** Enemy death */
  public enemyDeath(): void {
    this.playTone(200, 0.1, 'sawtooth', 0.3);
    this.playTone(100, 0.15, 'sawtooth', 0.2);
  }

  /** Player dodges */
  public dodge(): void {
    this.playTone(1000, 0.05, 'sine', 0.2);
    this.playTone(1200, 0.05, 'sine', 0.15);
  }

  /** Thorns damage */
  public thorns(): void {
    this.playTone(800, 0.03, 'square', 0.2);
  }

  // ========== UI Sounds ==========

  /** Shop purchase */
  public purchase(): void {
    this.playTone(500, 0.05, 'sine', 0.3);
    this.playTone(700, 0.05, 'sine', 0.3);
    this.playTone(900, 0.1, 'sine', 0.4);
  }
  
  // TODO - make private, use through event bus
  /** Error (not enough gold, etc.) */
  public error(): void {
    this.playTone(200, 0.1, 'square', 0.3);
    this.playTone(150, 0.15, 'square', 0.3);
  }

  /** Wave start */
  public waveStart(): void {
    this.playTone(400, 0.1, 'triangle', 0.3);
    this.playTone(500, 0.1, 'triangle', 0.3);
    this.playTone(600, 0.15, 'triangle', 0.4);
  }

  /** Boss spawn */
  private bossSpawn(): void {
    this.playTone(100, 0.3, 'sawtooth', 0.5);
    this.playTone(80, 0.4, 'sawtooth', 0.4);
    this.playTone(60, 0.5, 'sawtooth', 0.3);
  }

  /** Game over */
  public gameOver(): void {
    this.playTone(400, 0.2, 'sawtooth', 0.4);
    this.playToneDelayed(300, 0.2, 150, 'sawtooth', 0.4);
    this.playToneDelayed(200, 0.3, 300, 'sawtooth', 0.4);
    this.playToneDelayed(100, 0.5, 450, 'sawtooth', 0.5);
  }

  // TODO - make private, use through event bus
  /** Countdown tick */
  public countdownTick(secondsLeft: number): void {
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

  // ========== Settings ==========

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

  /**
   * Connect to EventBus for automatic sound playback
   */
  public connectToEventBus(): void {
    EventBus.on('goldCollected', () => { this.collectGold(); });
    EventBus.on('healthCollected', () => { this.collectHealth(); });
    EventBus.on('playerHit', () => { this.playerHit(); });
    EventBus.on('enemyDamaged', () => { this.enemyHit(); });
    EventBus.on('enemyDeath', () => { this.enemyDeath(); });
    EventBus.on('waveStart', () => { this.waveStart(); });
    EventBus.on('bossSpawned', () => { this.bossSpawn(); });
    EventBus.on('itemPurchased', () => { this.purchase(); });
    EventBus.on('weaponPurchased', () => { this.purchase(); });
    EventBus.on('gameOver', () => { this.gameOver(); });
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
