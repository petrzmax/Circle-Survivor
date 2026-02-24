import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers';
import { PickupType } from '@/types/enums';

@singleton()
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
    const xpAmount = Math.floor(amount * player.xpMultiplier);
    player.xp += xpAmount;
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
