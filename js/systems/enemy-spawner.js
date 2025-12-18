// Enemy Spawner - handles enemy death effects, drops, and spawns
// Extracted from game.js for better organization

const EnemySpawner = {
    /**
     * Handle enemy death - drops, effects, special abilities
     * @param {Game} game - Game instance
     * @param {Enemy} enemy - Enemy that died
     * @param {number} currentTime - Current timestamp
     */
    handleEnemyDeath(game, enemy, currentTime) {
        const luck = game.player.luck;
        
        // Death sound
        if (enemy.isBoss) {
            audio.nukeExplosion();
        } else {
            audio.enemyDeath();
        }
        
        // XP - collected immediately
        const xpGained = Math.floor(enemy.xpValue * game.player.xpMultiplier);
        game.xp += xpGained;
        audio.collectXP();
        
        // Gold drops
        this.spawnGoldDrops(game, enemy, luck);
        
        // Health drop chance (15% base + luck bonus)
        if (Math.random() < (0.15 + luck * 0.2)) {
            game.pickups.push(new Pickup(
                enemy.x + randomRange(-10, 10),
                enemy.y + randomRange(-10, 10),
                'health',
                10
            ));
        }
        
        // Death effect (particle burst)
        EffectsSystem.createDeathEffect(game, enemy);
        
        // Exploder - deals damage to player if close
        if (enemy.explodeOnDeath) {
            this.handleExploderDeath(game, enemy, currentTime);
        }
        
        // Splitter - spawns smaller enemies
        if (enemy.splitOnDeath) {
            this.handleSplitterDeath(game, enemy);
        }
    },
    
    /**
     * Spawn gold drops from enemy
     * @param {Game} game - Game instance
     * @param {Enemy} enemy - Enemy that died
     * @param {number} luck - Player's luck stat
     */
    spawnGoldDrops(game, enemy, luck) {
        if (enemy.isBoss) {
            // One large bag (50% of value) in center
            game.pickups.push(new Pickup(
                enemy.x,
                enemy.y,
                'gold',
                Math.floor(enemy.goldValue * 0.5)
            ));
            
            // 6-8 small bags scattered around
            const smallBags = 6 + Math.floor(Math.random() * 3);
            const smallValue = Math.floor((enemy.goldValue * 0.5) / smallBags);
            for (let i = 0; i < smallBags; i++) {
                const angle = (Math.PI * 2 / smallBags) * i;
                const dist = 20 + Math.random() * 30;
                game.pickups.push(new Pickup(
                    enemy.x + Math.cos(angle) * dist,
                    enemy.y + Math.sin(angle) * dist,
                    'gold',
                    smallValue
                ));
            }
        } else {
            // Normal enemy - one bag
            game.pickups.push(new Pickup(
                enemy.x + randomRange(-10, 10),
                enemy.y + randomRange(-10, 10),
                'gold',
                enemy.goldValue
            ));
        }
        
        // Bonus gold z luck
        if (luck > 0 && Math.random() < luck) {
            game.pickups.push(new Pickup(
                enemy.x + randomRange(-15, 15),
                enemy.y + randomRange(-15, 15),
                'gold',
                Math.floor(enemy.goldValue * 0.5)
            ));
        }
    },
    
    /**
     * Handle exploder enemy death
     * @param {Game} game - Game instance
     * @param {Enemy} enemy - Exploder enemy
     * @param {number} currentTime - Current timestamp
     */
    handleExploderDeath(game, enemy, currentTime) {
        const distToPlayer = distance(enemy, game.player);
        if (distToPlayer < enemy.explosionRadius) {
            const isDead = game.player.takeDamage(enemy.explosionDamage, currentTime);
            if (isDead) game.gameOver();
        }
        // Visual explosion effect
        EffectsSystem.createExplosion(game, enemy.x, enemy.y, enemy.explosionRadius);
    },
    
    /**
     * Handle splitter enemy death - spawn smaller enemies
     * @param {Game} game - Game instance
     * @param {Enemy} enemy - Splitter enemy
     */
    handleSplitterDeath(game, enemy) {
        for (let i = 0; i < enemy.splitCount; i++) {
            const angle = (Math.PI * 2 / enemy.splitCount) * i;
            const spawnX = enemy.x + Math.cos(angle) * 30;
            const spawnY = enemy.y + Math.sin(angle) * 30;
            game.enemies.push(new Enemy(spawnX, spawnY, 'swarm'));
        }
    }
};
