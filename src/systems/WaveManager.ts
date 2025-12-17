/**
 * Wave Management
 * Controls wave progression, enemy spawning, boss spawning
 * Matches original js/wave.js exactly.
 */

import { GAME_BALANCE } from '@/config/balance.config';
import { EnemyType } from '@/types/enums';
import { Enemy } from '@/entities/Enemy';
import { getSpawnPoint, CanvasBounds } from '@/utils/random';

// ============ Types ============

export interface WaveUpdateResult {
  enemies: Enemy[];
  waveEnded: boolean;
  countdown: number | false;
}

// ============ Wave Manager Class ============

export class WaveManager {
  waveNumber: number = 1;
  waveTime: number = 30; // seconds
  timeRemaining: number = 30;
  isWaveActive: boolean = false;
  spawnTimer: number = 0;
  spawnInterval: number = 800; // ms between spawns
  enemiesPerSpawn: number = 2;
  bossSpawned: boolean = false;
  private lastCountdownSecond: number = -1;

  constructor() {
    this.timeRemaining = this.waveTime;
  }

  /**
   * Start a new wave
   */
  startWave(): void {
    this.isWaveActive = true;
    this.timeRemaining = this.getWaveDuration();
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.lastCountdownSecond = -1; // Reset countdown
    this.updateSpawnSettings();
  }

  /**
   * End current wave
   */
  endWave(): void {
    this.isWaveActive = false;
    this.waveNumber++;
  }

  /**
   * Get wave duration based on wave number
   */
  getWaveDuration(): number {
    if (this.waveNumber <= 2) return GAME_BALANCE.wave.duration.early;
    if (this.waveNumber <= 4) return GAME_BALANCE.wave.duration.mid;
    return GAME_BALANCE.wave.duration.late;
  }

  /**
   * Update spawn settings based on current wave
   */
  updateSpawnSettings(): void {
    const wave = this.waveNumber;

    // Slower spawn - every 1000-400ms
    this.spawnInterval = Math.max(400, 1000 - wave * 50);

    // Less enemies per spawn: 1-4
    this.enemiesPerSpawn = Math.min(4, 1 + Math.floor(wave * 0.4));

    console.log(`Fala ${wave}: spawn co ${this.spawnInterval}ms, ${this.enemiesPerSpawn} wrogów/spawn`);
  }

  /**
   * Update wave state
   */
  update(deltaTime: number, canvas: CanvasBounds, bossAlive: boolean = false): WaveUpdateResult {
    if (!this.isWaveActive) return { enemies: [], waveEnded: false, countdown: false };

    const enemies: Enemy[] = [];

    // When boss is alive - stop timer and don't spawn new enemies
    if (bossAlive) {
      return { enemies: [], waveEnded: false, countdown: false };
    }

    // Update timer (only when boss is dead)
    this.timeRemaining -= deltaTime / 1000;

    // Countdown in last 3 seconds
    let countdown: number | false = false;
    if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
      const currentSecond = Math.ceil(this.timeRemaining);
      if (currentSecond !== this.lastCountdownSecond && currentSecond >= 1 && currentSecond <= 3) {
        this.lastCountdownSecond = currentSecond;
        countdown = currentSecond; // Return current second
      }
    }

    if (this.timeRemaining <= 0) {
      return { enemies: [], waveEnded: true, countdown: 0 }; // 0 = final sound
    }

    // Spawn boss every 3 waves
    if (this.shouldSpawnBoss()) {
      const spawn = getSpawnPoint(canvas);
      const bossType = this.getBossType();
      const boss = new Enemy({ x: spawn.x, y: spawn.y, type: bossType });

      // Scaling 1: With boss wave number (+50% HP, +25% DMG per boss wave)
      const bossWave = Math.floor(this.waveNumber / 3);
      const bossMultiplierHp = 1 + (bossWave - 1) * GAME_BALANCE.boss.hpScalePerWave;
      const bossMultiplierDmg = 1 + (bossWave - 1) * GAME_BALANCE.boss.dmgScalePerWave;

      // Scaling 2: Exponential like regular enemies (1.04^n from wave 3)
      let expMultiplier = 1;
      if (this.waveNumber >= 3) {
        const scalingWave = this.waveNumber - 3;
        expMultiplier = Math.pow(GAME_BALANCE.boss.exponentialBase, scalingWave);
      }

      // Combined scaling
      boss.maxHp = Math.round(boss.maxHp * bossMultiplierHp * expMultiplier);
      boss.hp = boss.maxHp;
      boss.damage = Math.round(boss.damage * bossMultiplierDmg * expMultiplier);

      enemies.push(boss);
      this.bossSpawned = true;
    }

    // Spawn enemies (only when boss is dead)
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      for (let i = 0; i < this.enemiesPerSpawn; i++) {
        const spawn = getSpawnPoint(canvas);
        const type = this.getRandomEnemyType();
        const enemy = new Enemy({ x: spawn.x, y: spawn.y, type: type });

        // Enemy scaling from wave 5 (exponential: scalingFactor^n)
        if (this.waveNumber >= GAME_BALANCE.enemy.scalingStartWave) {
          const scalingWave = this.waveNumber - GAME_BALANCE.enemy.scalingStartWave;
          const multiplier = Math.pow(GAME_BALANCE.enemy.scalingFactor, scalingWave);
          enemy.hp = Math.round(enemy.hp * multiplier);
          enemy.maxHp = enemy.hp;
          enemy.damage = Math.round(enemy.damage * multiplier);
        }

        enemies.push(enemy);
      }
    }

    return { enemies, waveEnded: false, countdown };
  }

  /**
   * Get random enemy type based on current wave
   */
  getRandomEnemyType(): EnemyType {
    const wave = this.waveNumber;
    const rand = Math.random();

    // Wave 1: only basic
    if (wave === 1) {
      return EnemyType.BASIC;
    }

    // Wave 2: + fast
    if (wave === 2) {
      if (rand < 0.6) return EnemyType.BASIC;
      return EnemyType.FAST;
    }

    // Wave 3: + swarm
    if (wave === 3) {
      if (rand < 0.4) return EnemyType.BASIC;
      if (rand < 0.7) return EnemyType.FAST;
      return EnemyType.SWARM;
    }

    // Wave 4: + tank
    if (wave === 4) {
      if (rand < 0.3) return EnemyType.BASIC;
      if (rand < 0.5) return EnemyType.FAST;
      if (rand < 0.75) return EnemyType.SWARM;
      return EnemyType.TANK;
    }

    // Wave 5: + zigzag (boss wave!)
    if (wave === 5) {
      if (rand < 0.25) return EnemyType.BASIC;
      if (rand < 0.4) return EnemyType.FAST;
      if (rand < 0.6) return EnemyType.SWARM;
      if (rand < 0.8) return EnemyType.TANK;
      return EnemyType.ZIGZAG;
    }

    // Wave 6: + sprinter
    if (wave === 6) {
      if (rand < 0.2) return EnemyType.BASIC;
      if (rand < 0.35) return EnemyType.FAST;
      if (rand < 0.5) return EnemyType.SWARM;
      if (rand < 0.65) return EnemyType.TANK;
      if (rand < 0.8) return EnemyType.ZIGZAG;
      return EnemyType.SPRINTER;
    }

    // Wave 7: + exploder
    if (wave === 7) {
      if (rand < 0.15) return EnemyType.BASIC;
      if (rand < 0.3) return EnemyType.FAST;
      if (rand < 0.45) return EnemyType.SWARM;
      if (rand < 0.55) return EnemyType.TANK;
      if (rand < 0.7) return EnemyType.ZIGZAG;
      if (rand < 0.85) return EnemyType.SPRINTER;
      return EnemyType.EXPLODER;
    }

    // Wave 8: + ghost
    if (wave === 8) {
      if (rand < 0.1) return EnemyType.BASIC;
      if (rand < 0.2) return EnemyType.FAST;
      if (rand < 0.35) return EnemyType.SWARM;
      if (rand < 0.45) return EnemyType.TANK;
      if (rand < 0.6) return EnemyType.ZIGZAG;
      if (rand < 0.75) return EnemyType.SPRINTER;
      if (rand < 0.87) return EnemyType.EXPLODER;
      return EnemyType.GHOST;
    }

    // Wave 9: + splitter
    if (wave === 9) {
      if (rand < 0.1) return EnemyType.BASIC;
      if (rand < 0.2) return EnemyType.FAST;
      if (rand < 0.35) return EnemyType.SWARM;
      if (rand < 0.45) return EnemyType.TANK;
      if (rand < 0.55) return EnemyType.ZIGZAG;
      if (rand < 0.65) return EnemyType.SPRINTER;
      if (rand < 0.75) return EnemyType.EXPLODER;
      if (rand < 0.87) return EnemyType.GHOST;
      return EnemyType.SPLITTER;
    }

    // Wave 10+: + brute (all types)
    if (rand < 0.08) return EnemyType.BASIC;
    if (rand < 0.16) return EnemyType.FAST;
    if (rand < 0.3) return EnemyType.SWARM;
    if (rand < 0.4) return EnemyType.TANK;
    if (rand < 0.5) return EnemyType.ZIGZAG;
    if (rand < 0.6) return EnemyType.SPRINTER;
    if (rand < 0.72) return EnemyType.EXPLODER;
    if (rand < 0.82) return EnemyType.GHOST;
    if (rand < 0.92) return EnemyType.SPLITTER;
    return EnemyType.BRUTE;
  }

  /**
   * Check if boss should spawn
   */
  shouldSpawnBoss(): boolean {
    return this.waveNumber % 3 === 0 && !this.bossSpawned && this.timeRemaining < 20;
  }

  /**
   * Get boss type based on wave number
   */
  getBossType(): EnemyType {
    const bossWave = Math.floor(this.waveNumber / 3); // 1, 2, 3, 4...

    const bossTypes: EnemyType[] = [
      EnemyType.BOSS, // Wave 3 - basic
      EnemyType.BOSS_SWARM, // Wave 6 - splits into swarms
      EnemyType.BOSS_TANK, // Wave 9 - huge tank
      EnemyType.BOSS_SPEED, // Wave 12 - fast zigzag
      EnemyType.BOSS_EXPLODER, // Wave 15 - explodes on death
      EnemyType.BOSS_GHOST, // Wave 18 - semi-transparent
    ];

    // Cyclically select boss, but each next one has +50% HP
    const bossIndex = (bossWave - 1) % bossTypes.length;
    return bossTypes[bossIndex]!;
  }

  /**
   * Render wave info (deprecated - HUD handles this now)
   */
  render(_ctx: CanvasRenderingContext2D): void {
    // Bar removed - there's a counter in HUD
  }
}
