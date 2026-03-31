/**
 * Wave Management
 * Controls wave progression, enemy spawning timing, boss spawning decisions.
 */

import { GAME_BALANCE } from '@/config/balance.config';
import { BOSS_ROTATION, MAX_DEFINED_WAVE, WAVE_COMPOSITION } from '@/config/waves.config';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { EventBus } from '@/events/EventBus';
import { TimeManager } from '@/managers/TimeManager';
import { EnemyType } from '@/types/enums';
import { weightedRandom } from '@/utils';
import { singleton } from 'tsyringe';

// ============ Types ============

export interface WaveUpdateResult {
  waveEnded: boolean;
  countdown: number | false;
}

// ============ Wave Manager Class ============

@singleton()
export class WaveManager {
  public waveNumber: number = 1;
  public timeRemaining: number = 0;
  public isWaveActive: boolean = false;
  private spawnTimer: number = 0;
  private spawnInterval: number = 0;
  private enemiesPerSpawn: number = 0;
  private bossSpawned: boolean = false;
  private lastCountdownSecond: number = -1;

  private readonly waveConfig = GAME_BALANCE.wave;

  public constructor(
    private enemySpawnSystem: EnemySpawnSystem,
    private timeManager: TimeManager,
  ) {}

  public reset(): void {
    this.waveNumber = 1;
    this.timeRemaining = 0;
    this.isWaveActive = false;
    this.spawnTimer = 0;
    this.spawnInterval = 0;
    this.enemiesPerSpawn = 0;
    this.bossSpawned = false;
    this.lastCountdownSecond = -1;
  }

  public startWave(): void {
    this.isWaveActive = true;
    this.timeRemaining = this.getWaveDuration();
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.lastCountdownSecond = -1;
    this.updateSpawnSettings();

    EventBus.emit('waveStart', { waveNumber: this.waveNumber, enemyCount: 0 });
  }

  public endWave(): void {
    this.isWaveActive = false;
    this.waveNumber++;
  }

  public get currentWave(): number {
    return this.waveNumber;
  }

  public skipToWave(targetWave: number): void {
    this.waveNumber = Math.max(1, targetWave);
    this.isWaveActive = false;
    this.bossSpawned = false;
    this.startWave();
  }

  public update(bossAlive: boolean = false): WaveUpdateResult {
    if (!this.isWaveActive) return { waveEnded: false, countdown: false };

    if (bossAlive) {
      return { waveEnded: false, countdown: false };
    }

    const deltaTime = this.timeManager.getDelta();
    const deltaTimeMs = deltaTime * 1000;
    this.timeRemaining -= deltaTime;

    const countdown = this.checkCountdown();

    if (this.timeRemaining <= 0) {
      return { waveEnded: true, countdown: 0 };
    }

    if (this.shouldSpawnBoss()) {
      const bossType = this.getBossType();
      this.enemySpawnSystem.spawn(bossType, { waveNumber: this.waveNumber });
      this.bossSpawned = true;
    }

    this.spawnTimer += deltaTimeMs;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      const types: EnemyType[] = [];
      for (let i = 0; i < this.enemiesPerSpawn; i++) {
        types.push(this.getRandomEnemyType());
      }
      this.enemySpawnSystem.spawnBatch(types, this.waveNumber);
    }

    return { waveEnded: false, countdown };
  }

  // ============ Private ============

  private getWaveDuration(): number {
    if (this.waveNumber <= 2) return this.waveConfig.duration.early;
    if (this.waveNumber <= 4) return this.waveConfig.duration.mid;
    return this.waveConfig.duration.late;
  }

  private updateSpawnSettings(): void {
    const { spawn, enemiesPerSpawn } = this.waveConfig;
    const wave = this.waveNumber;

    this.spawnInterval = Math.max(
      spawn.minInterval,
      spawn.baseInterval - wave * spawn.reductionPerWave,
    );
    this.enemiesPerSpawn = Math.min(
      enemiesPerSpawn.max,
      1 + Math.floor(wave * enemiesPerSpawn.growthFactor),
    );
  }

  private checkCountdown(): number | false {
    if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
      const currentSecond = Math.ceil(this.timeRemaining);
      if (currentSecond !== this.lastCountdownSecond && currentSecond >= 1 && currentSecond <= 3) {
        this.lastCountdownSecond = currentSecond;
        return currentSecond;
      }
    }
    return false;
  }

  private getRandomEnemyType(): EnemyType {
    const effectiveWave = Math.min(this.waveNumber, MAX_DEFINED_WAVE);
    const composition = WAVE_COMPOSITION[effectiveWave]!;

    const types = composition.map((entry) => entry.type);
    const weights = composition.map((entry) => entry.weight);

    return weightedRandom(types, weights);
  }

  private shouldSpawnBoss(): boolean {
    return (
      this.waveNumber % this.waveConfig.bossInterval === 0 &&
      !this.bossSpawned &&
      this.timeRemaining < this.waveConfig.bossSpawnThreshold
    );
  }

  private getBossType(): EnemyType {
    const bossWave = Math.floor(this.waveNumber / this.waveConfig.bossInterval);
    const bossIndex = (bossWave - 1) % BOSS_ROTATION.length;
    return BOSS_ROTATION[bossIndex]!;
  }
}
