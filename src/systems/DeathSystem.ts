import { singleton } from 'tsyringe';
import { Enemy } from '@/domain/enemies';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { VisualEffect } from '@/types/enums';
import { KillSource } from './damage.types';

@singleton()
export class DeathSystem {
  /** Dead enemies pending processing */
  private pendingDeaths: Enemy[] = [];
  private isPlayerDeathPending: boolean = false;

  public constructor(private entityManager: EntityManager) {}

  /**
   * Mark an enemy as pending death processing.
   * Called by CollisionResponseSystem / ExplosionSystem after DamageSystem confirms kill.
   */
  public registerEnemyDeath(enemy: Enemy): void {
    this.pendingDeaths.push(enemy);
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
   * - Enemy: emit enemyDeath, queue explode-on-death, destroy
   * - Player: emit playerDeath
   */
  public processDeaths(): void {
    // Process enemy deaths
    while (this.pendingDeaths.length > 0) {
      const enemy = this.pendingDeaths.shift()!;

      // Skip already-destroyed enemies (deduplication from multiple damage sources)
      if (!enemy.isActive) continue;

      // Explode-on-death: queue via EventBus — ExplosionSystem listens
      if (enemy.explodeOnDeath && enemy.explosionRadius > 0) {
        EventBus.emit('queueExplosion', {
          position: { x: enemy.position.x, y: enemy.position.y },
          radius: enemy.explosionRadius,
          damage: enemy.explosionDamage,
          visualEffect: VisualEffect.STANDARD,
          sourceId: enemy.id,
          isEnemyExplosion: true,
        });
      }

      EventBus.emit('enemyDeath', {
        enemy,
        killer: KillSource.PLAYER,
      });

      enemy.destroy();
    }

    // Process player death
    if (this.isPlayerDeathPending) {
      const player = this.entityManager.getPlayer();
      // Check if player is still dead (health pickup might have saved them)
      if (player.isDead()) {
        EventBus.emit('playerDeath', { player, killedBy: null });
      }
      this.isPlayerDeathPending = false;
    }
  }
}
