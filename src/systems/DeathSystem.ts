import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { EnemyData, Health, IsBoss, IsDead, Position } from '@/ecs/traits';
import { EventBus } from '@/events/EventBus';
import type { EnemyDeathData } from '@/events/GameEvents';
import { EntityManager } from '@/managers/EntityManager';
import { VisualEffect } from '@/types/enums';
import { KillSource } from './damage.types';

@singleton()
export class DeathSystem {
  /** Dead enemies pending processing */
  private pendingDeaths: Entity[] = [];
  private isPlayerDeathPending: boolean = false;

  public constructor(private entityManager: EntityManager) {}

  /**
   * Mark an enemy entity as pending death processing.
   */
  public registerEnemyDeath(entity: Entity): void {
    this.pendingDeaths.push(entity);
  }

  /**
   * Mark the player as pending death processing.
   */
  public registerPlayerDeath(): void {
    this.isPlayerDeathPending = true;
  }

  /**
   * Whether there are pending deaths to process.
   */
  public hasPendingDeaths(): boolean {
    return this.pendingDeaths.length > 0 || this.isPlayerDeathPending;
  }

  /**
   * Process all pending deaths.
   * - Enemy: emit enemyDeath, queue explode-on-death, add IsDead
   * - Player: emit playerDeath
   */
  public processDeaths(): void {
    // Process enemy deaths
    while (this.pendingDeaths.length > 0) {
      const entity = this.pendingDeaths.shift()!;

      // Skip already-destroyed enemies (deduplication from multiple damage sources)
      if (entity.has(IsDead)) continue;

      const enemy = entity.get(EnemyData)!;
      const pos = entity.get(Position)!;

      // Explode-on-death: queue via EventBus — ExplosionSystem listens
      if (enemy.explodeOnDeath && enemy.explosionRadius > 0) {
        EventBus.emit('queueExplosion', {
          position: pos,
          radius: enemy.explosionRadius,
          damage: enemy.explosionDamage,
          visualEffect: VisualEffect.STANDARD,
          sourceId: entity.id(),
          isEnemyExplosion: true,
        });
      }

      // Snapshot enemy data into a POJO before destroying
      const deathData: EnemyDeathData = {
        position: pos,
        type: enemy.type,
        color: enemy.color,
        isBoss: entity.has(IsBoss),
        xpValue: enemy.xpValue,
        goldValue: enemy.goldValue,
        splitOnDeath: enemy.splitOnDeath,
        splitCount: enemy.splitCount,
      };

      EventBus.emit('enemyDeath', {
        enemy: deathData,
        killer: KillSource.PLAYER,
      });

      // Mark dead
      if (!entity.has(IsDead)) {
        entity.add(IsDead);
      }
    }

    // Process player death
    if (this.isPlayerDeathPending) {
      const playerEntity = this.entityManager.getPlayerEntity();
      const h = playerEntity.get(Health)!;
      // Check if player is still dead (health pickup might have saved them)
      if (h.hp <= 0) {
        EventBus.emit('playerDeath', undefined);
      }
      this.isPlayerDeathPending = false;
    }
  }
}
