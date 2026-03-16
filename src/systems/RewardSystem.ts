import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { healEntity } from '@/ecs/utils/entity-utils';
import { EntityManager } from '@/managers/EntityManager';
import { PickupType } from '@/types/enums';

@singleton()
export class RewardSystem {
  public constructor(private entityManager: EntityManager) {
    this.connectToEventBus();
  }

  private reduceGold(cost: number): void {
    const stats = this.entityManager.getPlayerStats();
    stats.gold -= cost;
  }

  private addGold(amount: number): void {
    const stats = this.entityManager.getPlayerStats();
    const goldAmount = Math.floor(amount * stats.goldMultiplier);
    stats.gold += goldAmount;
  }

  private addXp(amount: number): void {
    const stats = this.entityManager.getPlayerStats();
    const xpAmount = Math.floor(amount * stats.xpMultiplier);
    stats.xp += xpAmount;
  }

  private addHealth(amount: number): void {
    const player = this.entityManager.getPlayerEntity();
    healEntity(player, amount);
  }

  private connectToEventBus(): void {
    EventBus.on('itemPurchased', ({ cost }) => {
      this.reduceGold(cost);
    });

    EventBus.on('weaponSold', ({ sellPrice }) => {
      const stats = this.entityManager.getPlayerStats();
      stats.gold += sellPrice;
    });

    EventBus.on('pickupCollected', ({ type, amount }) => {
      switch (type) {
        case PickupType.GOLD:
          this.addGold(amount);
          break;
        case PickupType.HEALTH:
          this.addHealth(amount);
          break;
      }
    });

    EventBus.on('enemyDeath', ({ enemy }) => {
      this.addXp(enemy.xpValue);
    });
  }
}
