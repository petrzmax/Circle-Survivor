// TODO, implement, extract from CombatSystem.ts
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
