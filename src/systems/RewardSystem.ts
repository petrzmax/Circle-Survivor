import { EntityManager } from '@/managers';
// TODO, implement, extract from CombatSystem.ts
// Listen to pickupCollected events
// Apply gold multipliers
// Update player gold/health
// ✅ Single responsibility: "What happens when player gets X?"

import { EventBus } from '@/core';

// // CombatSystem
// enemy.takeDamage() → isDead → EventBus.emit('enemyKilled', {
//   enemy,      // Has xpValue, goldValue, type, position
//   killer,     // 'player' | 'explosion'
//   playerStats // { luck, goldMultiplier } - needed for drops
// })

// // PickupSpawnSystem (NEW)
// EventBus.on('enemyKilled', ({ enemy, playerStats }) => {
//   spawnGoldPickups(enemy, playerStats.luck);
//   spawnHealthPickup(enemy, playerStats.luck);
// });

//  RewardSystem
// EventBus.on('pickupCollected', ({ pickup, player }) => {
//   applyReward(pickup, player);
// });

export class RewardSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.connectToEventBus();
  }

  private decreaseGold(cost: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) throw new Error('No player entity found in RewardSystem.decreaseGold');
    player.gold -= cost;
  }

  private connectToEventBus(): void {
    EventBus.on('itemPurchased', ({ cost }) => {
      this.decreaseGold(cost);
    });
  }
}
