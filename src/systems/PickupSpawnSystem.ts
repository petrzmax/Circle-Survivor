import { GAME_BALANCE } from '@/config';
import { EventBus } from '@/events/EventBus';
import type { EnemyDeathData } from '@/events/GameEvents';
import { createGoldPickup, createHealthPickup } from '@/factories';
import { EntityManager } from '@/managers';
import { randomChance, randomInt, randomPointInCircle, vectorFromAngle } from '@/utils';
import { addVectors, TWO_PI } from '@/utils/math';
import { singleton } from 'tsyringe';

@singleton()
export class PickupSpawnSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.connectToEventBus();
  }

  private spawnGoldPickups(enemy: EnemyDeathData): void {
    // Drop gold - bosses drop multiple bags for satisfying effect
    if (enemy.isBoss) {
      // One large bag (50% of value) in center
      createGoldPickup(enemy.position, Math.floor(enemy.goldValue * 0.5));

      // 6-8 small bags scattered around
      const smallBags = randomInt(6, 8);
      const smallValue = Math.floor((enemy.goldValue * 0.5) / smallBags);
      for (let i = 0; i < smallBags; i++) {
        const angle = (TWO_PI / smallBags) * i;
        const dist = randomInt(20, 50);
        const offset = vectorFromAngle(angle, dist);
        createGoldPickup(addVectors(enemy.position, offset), smallValue);
      }
    } else {
      // Normal enemy - one bag with random offset
      if (enemy.goldValue > 0) {
        const goldPosition = randomPointInCircle(enemy.position, 10);
        createGoldPickup(goldPosition, enemy.goldValue);
      }
    }
  }

  private spawnHealthPickup(enemy: EnemyDeathData): void {
    const stats = this.entityManager.getPlayerStats();

    // Chance for health drop (base + luck bonus)
    const healthDropChance = stats.healthDropChance + stats.luck * stats.healthDropLuckMultiplier;

    if (randomChance(healthDropChance)) {
      // spawnPickup adds directly to world — test via world.query(IsPickup).
      createHealthPickup(
        // TODO random offset
        { x: enemy.position.x + 20, y: enemy.position.y },
        GAME_BALANCE.drops.healthDropValue,
      );
    }
  }

  private connectToEventBus(): void {
    EventBus.on('enemyDeath', ({ enemy }) => {
      this.spawnGoldPickups(enemy);
      this.spawnHealthPickup(enemy);
    });
  }
}
