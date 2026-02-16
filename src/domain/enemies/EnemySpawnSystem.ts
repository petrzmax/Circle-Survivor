import { ConfigService } from '@/config/ConfigService';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { EnemyType } from '@/types/enums';
import { TWO_PI, Vector2 } from '@/utils/math';
import { getSpawnPoint } from '@/utils/random';
import { singleton } from 'tsyringe';
import { Enemy } from './Enemy';
import { EnemyCreateOptions, EnemyFactory } from './EnemyFactory';

export interface EnemySpawnOptions extends EnemyCreateOptions {
  /** Explicit spawn position. If omitted, a random edge position is generated. */
  position?: Vector2;
}

/** Offset distance for split enemies from the parent's death position */
const SPLIT_OFFSET = 30;

/** Scale factor for split enemies */
const SPLIT_SCALE = 0.6;

@singleton()
export class EnemySpawnSystem {
  public constructor(
    private entityManager: EntityManager,
    private enemyFactory: EnemyFactory,
    private configService: ConfigService,
  ) {
    this.listenForSplitSpawns();
  }

  /**
   * Spawn a single enemy into the game world.
   * Generates a random edge position if none provided.
   * Emits `bossSpawned` event for boss enemies.
   */
  public spawn(type: EnemyType, options?: EnemySpawnOptions): Enemy {
    const position = options?.position ?? this.getRandomSpawnPosition();

    const enemy = this.enemyFactory.create(type, position, {
      waveNumber: options?.waveNumber,
      scale: options?.scale,
    });

    this.entityManager.addEnemy(enemy);

    if (enemy.isBoss) {
      EventBus.emit('bossSpawned', { enemy, bossName: enemy.bossName ?? 'Boss' });
    }

    return enemy;
  }

  /**
   * Spawn multiple enemies of given types (all at random positions).
   */
  public spawnBatch(types: EnemyType[], waveNumber?: number): Enemy[] {
    return types.map((type) => this.spawn(type, { waveNumber }));
  }

  /**
   * Generate a random spawn position at the edge of the canvas.
   */
  private getRandomSpawnPosition(): Vector2 {
    const canvas = this.configService.getCanvasBounds();
    return getSpawnPoint(canvas);
  }

  /**
   * Listen to enemyDeath events for split-on-death spawning.
   */
  private listenForSplitSpawns(): void {
    EventBus.on('enemyDeath', ({ enemy }) => {
      if (!enemy.splitOnDeath) return;
      this.spawnSplitEnemies(enemy);
    });
  }

  /**
   * Spawn split enemies around the parent's death position.
   * Distributes children evenly in a circle.
   */
  private spawnSplitEnemies(parent: Enemy): void {
    const splitType = parent.type === EnemyType.SPLITTER ? EnemyType.SWARM : EnemyType.BASIC;

    for (let i = 0; i < parent.splitCount; i++) {
      const angle = (TWO_PI * i) / parent.splitCount;
      const position: Vector2 = {
        x: parent.position.x + Math.cos(angle) * SPLIT_OFFSET,
        y: parent.position.y + Math.sin(angle) * SPLIT_OFFSET,
      };

      this.spawn(splitType, { position, scale: SPLIT_SCALE });
    }
  }
}
