/**
 * WaveSystem - Manages wave progression and difficulty scaling.
 * Configures SpawnSystem based on current wave number.
 */

import { EntityManager } from '@/managers/EntityManager';
import { EventBus } from '@/core/EventBus';
import { SpawnSystem, WaveSpawnConfig } from './SpawnSystem';
import { EnemyType } from '@/types/enums';

/**
 * Wave state
 */
export enum WaveState {
  /** Between waves (shop, break) */
  IDLE = 'idle',
  /** Wave in progress */
  ACTIVE = 'active',
  /** All enemies spawned, waiting for kills */
  SPAWNING_COMPLETE = 'spawning_complete',
  /** Boss active */
  BOSS = 'boss',
  /** Wave completed */
  COMPLETED = 'completed',
}

/**
 * WaveSystem configuration
 */
export interface WaveSystemConfig {
  /** Base enemies per wave */
  baseEnemyCount?: number;
  /** Enemies added per wave */
  enemiesPerWave?: number;
  /** Base spawn rate */
  baseSpawnRate?: number;
  /** Spawn rate increase per wave */
  spawnRatePerWave?: number;
  /** Boss spawn interval (every N waves) */
  bossInterval?: number;
  /** Max spawn rate */
  maxSpawnRate?: number;
}

/**
 * Wave info for UI
 */
export interface WaveInfo {
  waveNumber: number;
  totalEnemies: number;
  enemiesKilled: number;
  state: WaveState;
  isBossWave: boolean;
}

/**
 * Manages wave progression and enemy spawning configuration.
 *
 * @example
 * ```typescript
 * const waveSystem = new WaveSystem(entityManager, spawnSystem);
 *
 * // Start first wave
 * waveSystem.startWave(1);
 *
 * // In game loop
 * waveSystem.update(deltaTime, playerX, playerY);
 *
 * // Check if wave complete
 * if (waveSystem.isWaveComplete()) {
 *   // Open shop, then start next wave
 *   waveSystem.startWave(waveSystem.getWaveNumber() + 1);
 * }
 * ```
 */
export class WaveSystem {
  private entityManager: EntityManager;
  private spawnSystem: SpawnSystem;

  // Configuration
  private baseEnemyCount: number;
  private enemiesPerWave: number;
  private baseSpawnRate: number;
  private spawnRatePerWave: number;
  private bossInterval: number;
  private maxSpawnRate: number;

  // State
  private waveNumber: number = 0;
  private state: WaveState = WaveState.IDLE;
  private totalEnemies: number = 0;
  private enemiesKilled: number = 0;

  constructor(
    entityManager: EntityManager,
    spawnSystem: SpawnSystem,
    config: WaveSystemConfig = {},
  ) {
    this.entityManager = entityManager;
    this.spawnSystem = spawnSystem;

    // Apply config with defaults
    this.baseEnemyCount = config.baseEnemyCount ?? 10;
    this.enemiesPerWave = config.enemiesPerWave ?? 5;
    this.baseSpawnRate = config.baseSpawnRate ?? 2;
    this.spawnRatePerWave = config.spawnRatePerWave ?? 0.2;
    this.bossInterval = config.bossInterval ?? 3;
    this.maxSpawnRate = config.maxSpawnRate ?? 10;

    // Listen for enemy death events
    EventBus.on('enemyDeath', () => {
      if (
        this.state === WaveState.ACTIVE ||
        this.state === WaveState.SPAWNING_COMPLETE ||
        this.state === WaveState.BOSS
      ) {
        this.enemiesKilled++;
        this.checkWaveCompletion();
      }
    });

    // Listen for boss defeat
    EventBus.on('bossDefeated', () => {
      if (this.state === WaveState.BOSS) {
        this.checkWaveCompletion();
      }
    });
  }

  /**
   * Start a new wave
   */
  startWave(waveNumber: number): void {
    this.waveNumber = waveNumber;
    this.enemiesKilled = 0;

    // Calculate wave parameters
    const isBossWave = waveNumber % this.bossInterval === 0;
    this.totalEnemies = this.calculateEnemyCount(waveNumber);
    const spawnRate = this.calculateSpawnRate(waveNumber);
    const enemyWeights = this.getEnemyWeights(waveNumber);

    // Configure spawn system
    const spawnConfig: WaveSpawnConfig = {
      enemyWeights,
      totalEnemies: this.totalEnemies,
      spawnRate,
      hasBoss: isBossWave,
      bossType: EnemyType.BOSS,
    };

    this.spawnSystem.setWaveConfig(spawnConfig);

    // Set difficulty scaling
    const scaleFactor = this.calculateScaleFactor(waveNumber);
    const hpFactor = this.calculateHpFactor(waveNumber);
    this.spawnSystem.setEnemyMultipliers(scaleFactor, hpFactor);

    this.state = WaveState.ACTIVE;

    EventBus.emit('waveStart', {
      waveNumber,
      enemyCount: this.totalEnemies,
    });
  }

  /**
   * Update wave system
   */
  update(deltaTime: number, playerX: number, playerY: number): void {
    if (this.state === WaveState.IDLE || this.state === WaveState.COMPLETED) {
      return;
    }

    // Update spawn system
    this.spawnSystem.update(deltaTime, playerX, playerY);

    // Check if spawning is complete
    if (this.state === WaveState.ACTIVE && this.spawnSystem.isWaveSpawnComplete()) {
      // Check if this is a boss wave
      if (this.isBossWave() && !this.spawnSystem.isBossSpawned()) {
        // Spawn boss when all regular enemies are dead
        if (this.entityManager.getActiveEnemyCount() === 0) {
          this.spawnSystem.spawnBoss(playerX, playerY);
          this.state = WaveState.BOSS;
        }
      } else {
        this.state = WaveState.SPAWNING_COMPLETE;
      }
    }

    // Check wave completion
    this.checkWaveCompletion();
  }

  /**
   * Check if wave is complete
   */
  private checkWaveCompletion(): void {
    const activeEnemies = this.entityManager.getActiveEnemyCount();

    if (activeEnemies === 0 && this.spawnSystem.isWaveSpawnComplete()) {
      // For boss waves, need to confirm boss is dead too
      if (this.isBossWave() && !this.spawnSystem.isBossSpawned()) {
        return; // Boss not spawned yet
      }

      this.state = WaveState.COMPLETED;

      EventBus.emit('waveEnd', {
        waveNumber: this.waveNumber,
        enemiesKilled: this.enemiesKilled,
      });
    }
  }

  /**
   * Calculate enemy count for wave
   */
  private calculateEnemyCount(waveNumber: number): number {
    return Math.floor(this.baseEnemyCount + (waveNumber - 1) * this.enemiesPerWave);
  }

  /**
   * Calculate spawn rate for wave
   */
  private calculateSpawnRate(waveNumber: number): number {
    const rate = this.baseSpawnRate + (waveNumber - 1) * this.spawnRatePerWave;
    return Math.min(rate, this.maxSpawnRate);
  }

  /**
   * Calculate enemy scale factor for wave
   */
  private calculateScaleFactor(waveNumber: number): number {
    // Enemies get slightly larger in later waves
    return 1 + (waveNumber - 1) * 0.02; // 2% per wave
  }

  /**
   * Calculate enemy HP factor for wave
   */
  private calculateHpFactor(waveNumber: number): number {
    // HP increases more significantly
    return 1 + (waveNumber - 1) * 0.1; // 10% per wave
  }

  /**
   * Get enemy spawn weights for wave
   */
  private getEnemyWeights(waveNumber: number): Map<EnemyType, number> {
    const weights = new Map<EnemyType, number>();

    // Always spawn basic enemies
    weights.set(EnemyType.BASIC, 10);

    // Introduce enemy types based on wave number
    if (waveNumber >= 2) {
      weights.set(EnemyType.FAST, 3);
    }

    if (waveNumber >= 3) {
      weights.set(EnemyType.TANK, 2);
    }

    if (waveNumber >= 4) {
      weights.set(EnemyType.ZIGZAG, 2);
    }

    if (waveNumber >= 5) {
      weights.set(EnemyType.SWARM, 4);
      weights.set(EnemyType.BRUTE, 2);
    }

    if (waveNumber >= 7) {
      weights.set(EnemyType.EXPLODER, 1);
      weights.set(EnemyType.SPLITTER, 1);
    }

    if (waveNumber >= 10) {
      weights.set(EnemyType.GHOST, 1);
    }

    return weights;
  }

  /**
   * Check if current wave is a boss wave
   */
  isBossWave(): boolean {
    return this.waveNumber % this.bossInterval === 0;
  }

  /**
   * Check if wave is complete
   */
  isWaveComplete(): boolean {
    return this.state === WaveState.COMPLETED;
  }

  /**
   * Check if wave is active
   */
  isWaveActive(): boolean {
    return (
      this.state === WaveState.ACTIVE ||
      this.state === WaveState.SPAWNING_COMPLETE ||
      this.state === WaveState.BOSS
    );
  }

  /**
   * Get current wave number
   */
  getWaveNumber(): number {
    return this.waveNumber;
  }

  /**
   * Get wave state
   */
  getState(): WaveState {
    return this.state;
  }

  /**
   * Get wave info for UI
   */
  getWaveInfo(): WaveInfo {
    return {
      waveNumber: this.waveNumber,
      totalEnemies: this.totalEnemies,
      enemiesKilled: this.enemiesKilled,
      state: this.state,
      isBossWave: this.isBossWave(),
    };
  }

  /**
   * Get wave progress (0-1)
   */
  getProgress(): number {
    if (this.totalEnemies === 0) return 0;
    return this.enemiesKilled / this.totalEnemies;
  }

  /**
   * Get enemies remaining (alive + not yet spawned)
   */
  getEnemiesRemaining(): number {
    const spawned = this.totalEnemies - this.spawnSystem.getRemainingSpawns();
    const alive = spawned - this.enemiesKilled;
    return alive + this.spawnSystem.getRemainingSpawns();
  }

  /**
   * Skip to next wave (debug/cheat)
   */
  skipWave(): void {
    // Kill all enemies
    this.entityManager.getActiveEnemies().forEach((enemy) => {
      enemy.destroy();
    });

    // Force complete
    this.state = WaveState.COMPLETED;

    EventBus.emit('waveEnd', {
      waveNumber: this.waveNumber,
      enemiesKilled: this.enemiesKilled,
    });
  }

  /**
   * Reset wave system
   */
  reset(): void {
    this.waveNumber = 0;
    this.state = WaveState.IDLE;
    this.totalEnemies = 0;
    this.enemiesKilled = 0;
    this.spawnSystem.reset();
  }
}
