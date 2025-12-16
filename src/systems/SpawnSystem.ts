/**
 * SpawnSystem - Handles spawning of enemies and other entities.
 * Manages spawn points, enemy creation, and boss spawning.
 */

import { EntityManager } from '@/managers/EntityManager';
import { EventBus } from '@/core/EventBus';
import { Enemy } from '@/entities/Enemy';
import { EnemyType } from '@/types/enums';
import { getSpawnPoint } from '@/utils';

/**
 * Spawn configuration for a wave
 */
export interface WaveSpawnConfig {
  /** Enemy types to spawn with weights */
  enemyWeights: Map<EnemyType, number>;
  /** Total enemies to spawn */
  totalEnemies: number;
  /** Spawn rate (enemies per second) */
  spawnRate: number;
  /** Whether to spawn a boss at wave end */
  hasBoss: boolean;
  /** Boss type if hasBoss is true */
  bossType?: EnemyType;
}

/**
 * SpawnSystem configuration
 */
export interface SpawnSystemConfig {
  /** Canvas width for spawn point calculation */
  canvasWidth: number;
  /** Canvas height for spawn point calculation */
  canvasHeight: number;
  /** Minimum distance from player to spawn */
  minSpawnDistance?: number;
  /** Maximum distance from canvas edge */
  maxEdgeDistance?: number;
}

/**
 * Handles all entity spawning logic.
 * Creates enemies based on wave configuration.
 * 
 * @example
 * ```typescript
 * const spawnSystem = new SpawnSystem(entityManager, {
 *   canvasWidth: 900,
 *   canvasHeight: 700
 * });
 * 
 * // Start a wave
 * spawnSystem.setWaveConfig({
 *   enemyWeights: new Map([[EnemyType.BASIC, 1]]),
 *   totalEnemies: 20,
 *   spawnRate: 2,
 *   hasBoss: false
 * });
 * 
 * // In game loop
 * spawnSystem.update(deltaTime, playerPosition);
 * ```
 */
export class SpawnSystem {
  private entityManager: EntityManager;
  private canvasWidth: number;
  private canvasHeight: number;
  private maxEdgeDistance: number;

  /** Current wave spawn configuration */
  private waveConfig: WaveSpawnConfig | null = null;
  
  /** Enemies remaining to spawn in current wave */
  private enemiesRemaining: number = 0;
  
  /** Time accumulator for spawn rate */
  private spawnAccumulator: number = 0;
  
  /** Whether boss has been spawned for current wave */
  private bossSpawned: boolean = false;
  
  /** Scale multiplier for spawned enemies */
  private enemyScaleMultiplier: number = 1;
  
  /** HP multiplier for spawned enemies */
  private enemyHpMultiplier: number = 1;

  constructor(entityManager: EntityManager, config: SpawnSystemConfig) {
    this.entityManager = entityManager;
    this.canvasWidth = config.canvasWidth;
    this.canvasHeight = config.canvasHeight;
    this.maxEdgeDistance = config.maxEdgeDistance ?? 50;

    // Listen for enemy death events to handle splitting
    EventBus.on('enemyDeath', (data) => {
      if (data.enemy.splitOnDeath && data.enemy.splitCount > 0) {
        this.spawnSplitEnemies(data.enemy);
      }
    });
  }

  /**
   * Set wave spawn configuration
   */
  setWaveConfig(config: WaveSpawnConfig): void {
    this.waveConfig = config;
    this.enemiesRemaining = config.totalEnemies;
    this.spawnAccumulator = 0;
    this.bossSpawned = false;
  }

  /**
   * Set enemy stat multipliers (for scaling difficulty)
   */
  setEnemyMultipliers(scale: number, hp: number): void {
    this.enemyScaleMultiplier = scale;
    this.enemyHpMultiplier = hp;
  }

  /**
   * Update spawn system - spawn enemies based on rate
   */
  update(deltaTime: number, playerX: number, playerY: number): void {
    if (!this.waveConfig || this.enemiesRemaining <= 0) {
      return;
    }

    // Accumulate time
    this.spawnAccumulator += deltaTime;

    // Calculate spawn interval
    const spawnInterval = 1 / this.waveConfig.spawnRate;

    // Spawn enemies while we have accumulated enough time
    while (this.spawnAccumulator >= spawnInterval && this.enemiesRemaining > 0) {
      this.spawnAccumulator -= spawnInterval;
      this.spawnEnemy(playerX, playerY);
      this.enemiesRemaining--;
    }
  }

  /**
   * Spawn a single enemy
   */
  private spawnEnemy(_playerX: number, _playerY: number): void {
    if (!this.waveConfig) return;

    // Select enemy type based on weights
    const enemyType = this.selectEnemyType(this.waveConfig.enemyWeights);
    
    // Get spawn position
    const spawnPos = getSpawnPoint(
      { width: this.canvasWidth, height: this.canvasHeight },
      this.maxEdgeDistance
    );

    // Create enemy
    const enemy = new Enemy({
      x: spawnPos.x,
      y: spawnPos.y,
      type: enemyType,
      scale: this.enemyScaleMultiplier,
    });

    // Apply HP multiplier
    if (this.enemyHpMultiplier !== 1) {
      enemy.maxHp *= this.enemyHpMultiplier;
      enemy.hp = enemy.maxHp;
    }

    this.entityManager.addEnemy(enemy);
  }

  /**
   * Select enemy type based on weights
   */
  private selectEnemyType(weights: Map<EnemyType, number>): EnemyType {
    const entries = Array.from(weights.entries());
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const [type, weight] of entries) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }
    
    // Fallback to first type
    return entries[0]?.[0] ?? EnemyType.BASIC;
  }

  /**
   * Spawn boss enemy
   */
  spawnBoss(_playerX: number, _playerY: number, bossType: EnemyType = EnemyType.BOSS): void {
    if (this.bossSpawned) return;

    const spawnPos = getSpawnPoint(
      { width: this.canvasWidth, height: this.canvasHeight },
      this.maxEdgeDistance
    );

    const boss = new Enemy({
      x: spawnPos.x,
      y: spawnPos.y,
      type: bossType,
      scale: this.enemyScaleMultiplier,
    });

    // Apply HP multiplier to boss
    if (this.enemyHpMultiplier !== 1) {
      boss.maxHp *= this.enemyHpMultiplier;
      boss.hp = boss.maxHp;
    }

    this.entityManager.addEnemy(boss);
    this.bossSpawned = true;

    EventBus.emit('bossSpawned', {
      enemy: boss,
      bossName: boss.bossName ?? 'Unknown Boss',
    });
  }

  /**
   * Spawn split enemies when a splitter dies
   */
  private spawnSplitEnemies(parent: Enemy): void {
    const splitCount = parent.splitCount;
    const splitScale = 0.6; // Split enemies are smaller

    for (let i = 0; i < splitCount; i++) {
      // Spawn in a circle around parent position
      const angle = (i / splitCount) * Math.PI * 2;
      const distance = parent.radius * 2;
      
      const x = parent.x + Math.cos(angle) * distance;
      const y = parent.y + Math.sin(angle) * distance;

      // Determine split enemy type (usually same as parent but smaller)
      const splitType = parent.type === EnemyType.SPLITTER ? EnemyType.BASIC : parent.type;

      const splitEnemy = new Enemy({
        x,
        y,
        type: splitType,
        scale: splitScale * this.enemyScaleMultiplier,
      });

      // Split enemies don't split again
      splitEnemy.splitOnDeath = false;

      this.entityManager.addEnemy(splitEnemy);
    }
  }

  /**
   * Spawn enemy at specific position (for special spawns)
   */
  spawnEnemyAt(x: number, y: number, type: EnemyType, scale: number = 1): Enemy {
    const enemy = new Enemy({
      x,
      y,
      type,
      scale: scale * this.enemyScaleMultiplier,
    });

    if (this.enemyHpMultiplier !== 1) {
      enemy.maxHp *= this.enemyHpMultiplier;
      enemy.hp = enemy.maxHp;
    }

    this.entityManager.addEnemy(enemy);
    return enemy;
  }

  /**
   * Spawn multiple enemies at once (for swarm waves)
   */
  spawnSwarm(
    _playerX: number,
    _playerY: number,
    type: EnemyType,
    count: number,
    scale: number = 1
  ): void {
    for (let i = 0; i < count; i++) {
      const spawnPos = getSpawnPoint(
        { width: this.canvasWidth, height: this.canvasHeight },
        this.maxEdgeDistance
      );

      const enemy = new Enemy({
        x: spawnPos.x,
        y: spawnPos.y,
        type,
        scale: scale * this.enemyScaleMultiplier,
      });

      if (this.enemyHpMultiplier !== 1) {
        enemy.maxHp *= this.enemyHpMultiplier;
        enemy.hp = enemy.maxHp;
      }

      this.entityManager.addEnemy(enemy);
    }
  }

  /**
   * Check if all enemies for current wave have been spawned
   */
  isWaveSpawnComplete(): boolean {
    return this.enemiesRemaining <= 0;
  }

  /**
   * Check if boss has been spawned
   */
  isBossSpawned(): boolean {
    return this.bossSpawned;
  }

  /**
   * Get remaining enemies to spawn
   */
  getRemainingSpawns(): number {
    return this.enemiesRemaining;
  }

  /**
   * Force spawn remaining enemies instantly
   */
  forceSpawnRemaining(playerX: number, playerY: number): void {
    while (this.enemiesRemaining > 0) {
      this.spawnEnemy(playerX, playerY);
      this.enemiesRemaining--;
    }
  }

  /**
   * Update canvas dimensions
   */
  setCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Reset spawn system
   */
  reset(): void {
    this.waveConfig = null;
    this.enemiesRemaining = 0;
    this.spawnAccumulator = 0;
    this.bossSpawned = false;
    this.enemyScaleMultiplier = 1;
    this.enemyHpMultiplier = 1;
  }
}
