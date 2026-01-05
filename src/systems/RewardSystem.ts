import { EventBus } from '@/core';
import { EntityManager } from '@/managers';

export class RewardSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.connectToEventBus();
  }

  private reduceGold(cost: number): void {
    const player = this.entityManager.getPlayer();
    player.gold -= cost;
  }

  private addGold(amount: number): void {
    // TODO Apply gold multipliers
    const player = this.entityManager.getPlayer();
    player.gold += amount;
  }

  private addXp(amount: number): void {
    const player = this.entityManager.getPlayer();
    player.xp += amount;
  }

  private addHealth(amount: number): void {
    const player = this.entityManager.getPlayer();
    player.heal(amount);
  }

  private connectToEventBus(): void {
    EventBus.on('itemPurchased', ({ cost }) => {
      this.reduceGold(cost);
    });

    EventBus.on('goldCollected', ({ amount }) => {
      this.addGold(amount);
    });

    EventBus.on('enemyDeath', ({ enemy }) => {
      this.addXp(enemy.xpValue);
    });

    EventBus.on('healthCollected', ({ amount }) => {
      this.addHealth(amount);
    });
  }
}
