import { GAME_BALANCE } from '@/config';
import { EventBus } from '@/core';
import { Enemy } from '@/entities';
import { createGoldPickup, createHealthPickup } from '@/factories';
import { EntityManager } from '@/managers';
import { randomChance, randomInt, randomPointInCircle, vectorFromAngle } from '@/utils';
import { addVectors, TWO_PI } from '@/utils/math';

export class PickupSpawnSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.connectToEventBus();
  }

  private spawnGoldPickups(enemy: Enemy): void {
    // Drop gold - bosses drop multiple bags for satisfying effect
    if (enemy.isBoss) {
      // One large bag (50% of value) in center
      const bigPickup = createGoldPickup(enemy.position, Math.floor(enemy.goldValue * 0.5));
      this.entityManager.addPickup(bigPickup);

      // 6-8 small bags scattered around
      const smallBags = randomInt(6, 8);
      const smallValue = Math.floor((enemy.goldValue * 0.5) / smallBags);
      for (let i = 0; i < smallBags; i++) {
        const angle = (TWO_PI / smallBags) * i;
        const dist = randomInt(20, 50);
        const offset = vectorFromAngle(angle, dist);
        const smallPickup = createGoldPickup(addVectors(enemy.position, offset), smallValue);
        this.entityManager.addPickup(smallPickup);
      }
    } else {
      // Normal enemy - one bag with random offset
      if (enemy.goldValue > 0) {
        const goldPosition = randomPointInCircle(enemy.position, 10);
        const goldPickup = createGoldPickup(goldPosition, enemy.goldValue);
        this.entityManager.addPickup(goldPickup);
      }
    }
  }

  private spawnHealthPickup(enemy: Enemy): void {
    const player = this.entityManager.getPlayer();

    // Chance for health drop (base + luck bonus)
    const healthDropChance =
      player.healthDropChance + player.luck * player.healthDropLuckMultiplier;

    if (randomChance(healthDropChance)) {
      const healthPickup = createHealthPickup(
        // TODO random offset
        { x: enemy.position.x + 20, y: enemy.position.y },
        GAME_BALANCE.drops.healthDropValue,
      );
      this.entityManager.addPickup(healthPickup);
    }
  }

  private connectToEventBus(): void {
    EventBus.on('enemyDeath', ({ enemy, killer: _killer }) => {
      this.spawnGoldPickups(enemy);
      this.spawnHealthPickup(enemy);
    });
  }
}
