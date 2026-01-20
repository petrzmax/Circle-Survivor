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
    const player = this.entityManager.getPlayer();
    const goldAmount = Math.floor(amount * player.goldMultiplier);
    player.gold += goldAmount;
  }

  private addXp(amount: number): void {
    const player = this.entityManager.getPlayer();
    // TODO fix xp multiplier
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

    EventBus.on('weaponSold', ({ sellPrice }) => {
      const player = this.entityManager.getPlayer();
      player.gold += sellPrice;
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
