// TODO, implement, extract from CombatSystem.ts
// Listen to pickupCollected events
// Apply gold multipliers
// Update player gold/health
// ✅ Single responsibility: "What happens when player gets X?"

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

// // PickupSpawnSystem or RewardSystem
// EventBus.on('pickupCollected', ({ pickup, player }) => {
//   applyReward(pickup, player);
// });
