import type { Entity } from 'koota';
import { ConfigService } from '@/config/ConfigService';
import { EnemyData, IsBoss } from '@/ecs/traits';
import { EventBus } from '@/events/EventBus';
import type { EnemyDeathData } from '@/events/GameEvents';
import { EnemyType } from '@/types/enums';
import { TWO_PI, Vector2 } from '@/utils/math';
import { getSpawnPoint } from '@/utils/random';
import { singleton } from 'tsyringe';
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
  public spawn(type: EnemyType, options?: EnemySpawnOptions): Entity {
    const position = options?.position ?? this.getRandomSpawnPosition();

    const entity = this.enemyFactory.create(type, position, {
      waveNumber: options?.waveNumber,
      scale: options?.scale,
    });

    if (entity.has(IsBoss)) {
      const enemyData = entity.get(EnemyData)!;
      EventBus.emit('bossSpawned', { bossName: enemyData.bossName ?? 'Boss' });
    }

    return entity;
  }

  /**
   * Spawn multiple enemies of given types (all at random positions).
   */
  public spawnBatch(types: EnemyType[], waveNumber?: number): Entity[] {
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
  private spawnSplitEnemies(parent: EnemyDeathData): void {
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
