import { EntityManager } from '@/managers';
// TODO, implement, extract from CombatSystem.ts
// Listen to pickupCollected events
// Apply gold multipliers
// Update player gold/health

import { EventBus } from '@/core';

export class RewardSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.connectToEventBus();
  }

  private reduceGold(cost: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) throw new Error('No player entity found in RewardSystem.decreaseGold');
    player.gold -= cost;
  }

  private addGold(amount: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) throw new Error('No player entity found in RewardSystem.applyReward');
    player.gold += amount;
  }

  private addXp(amount: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) throw new Error('No player entity found in RewardSystem.addXp');
    player.xp += amount;
  }

  private addHealth(amount: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) throw new Error('No player entity found in RewardSystem.addHealth');
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
