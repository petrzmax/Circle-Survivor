// Combat System - handles explosions, chain effects, and special weapon mechanics
// Extracted from game.js for better organization

const CombatSystem = {
    /**
     * Handle explosion from weapons (bazooka, mines, nuke, holyGrenade, banana)
     * @param {Game} game - Game instance
     * @param {number} x - Explosion X position
     * @param {number} y - Explosion Y position
     * @param {number} radius - Explosion radius
     * @param {number} damage - Base damage
     * @param {boolean} isNuke - Is nuke explosion
     * @param {boolean} isHolyGrenade - Is holy grenade explosion
     * @param {boolean} isBanana - Is banana explosion
     * @param {number} currentTime - Current timestamp
     * @param {boolean} isMini - Is mini banana (no spawn)
     */
    handleExplosion(game, x, y, radius, damage, isNuke = false, isHolyGrenade = false, isBanana = false, currentTime, isMini = false) {
        // Explosion sound
        if (isNuke) {
            audio.nukeExplosion();
        } else {
            audio.explosion();
        }
        
        // Visual effect
        EffectsSystem.createExplosion(game, x, y, radius, isNuke, isHolyGrenade, isBanana);
        
        // Banana (not mini) - spawn mini bananas
        if (isBanana && !isMini) {
            this.spawnMiniBananas(game, x, y, 4 + Math.floor(Math.random() * 3));
        }
        
        // Deal damage to all enemies in range
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            const dist = distance({x, y}, enemy);
            
            if (dist < radius) {
                // Damage decreases with distance
                const damageFalloff = 1 - (dist / radius) * 0.5;
                const isDead = enemy.takeDamage(damage * damageFalloff, x, y, game.player.knockback * 1.5);
                
                // Lifesteal from explosions
                if (game.player.lifesteal > 0) {
                    game.player.heal(damage * damageFalloff * game.player.lifesteal);
                }
                
                if (isDead) {
                    game.handleEnemyDeath(enemy, currentTime);
                    game.enemies.splice(i, 1);
                }
            }
        }
    },
    
    /**
     * Spawn mini bananas after main banana explosion
     * @param {Game} game - Game instance
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} count - Number of mini bananas to spawn
     */
    spawnMiniBananas(game, x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
            const config = WEAPON_TYPES.minibanana;
            
            // Random speed (6-10) and distance (60-100px) for each mini banana
            const randomSpeed = 6 + Math.random() * 4;
            const randomRange = 60 + Math.random() * 40;
            
            const bullet = new Bullet(
                x, y,
                Math.cos(angle) * randomSpeed,
                Math.sin(angle) * randomSpeed,
                config.damage * game.player.damageMultiplier,
                config.color,
                false
            );
            
            bullet.radius = config.bulletRadius;
            bullet.explosive = config.explosive;
            bullet.explosionRadius = config.explosionRadius * game.player.explosionRadius;
            bullet.isBanana = config.isBanana;
            bullet.isMini = true;
            bullet.weaponCategory = config.weaponCategory;
            bullet.explosiveRange = randomRange;
            bullet.baseSpeed = randomSpeed;
            bullet.startX = x;
            bullet.startY = y;
            bullet.distanceTraveled = 0;
            
            game.bullets.push(bullet);
        }
    },
    
    /**
     * Handle chain lightning effect (crossbow)
     * @param {Game} game - Game instance
     * @param {number} startX - Chain start X position
     * @param {number} startY - Chain start Y position
     * @param {number} damage - Damage per chain hit
     * @param {number} chainCount - Number of chain jumps
     * @param {number} currentTime - Current timestamp
     */
    handleChainEffect(game, startX, startY, damage, chainCount, currentTime) {
        if (!game.chainEffects) game.chainEffects = [];
        
        audio.chainEffect();
        
        const chainedEnemyIds = new Set();
        let currentX = startX;
        let currentY = startY;
        const chainRange = 150;
        
        for (let i = 0; i < chainCount; i++) {
            // Find nearest enemy not already in chain
            let nearestDist = Infinity;
            let nearestEnemy = null;
            
            for (const enemy of game.enemies) {
                if (!enemy || chainedEnemyIds.has(enemy)) continue;
                
                const dist = distance({x: currentX, y: currentY}, enemy);
                if (dist < chainRange && dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
            
            if (!nearestEnemy) break;
            
            // Save position BEFORE everything else
            const enemyX = nearestEnemy.x;
            const enemyY = nearestEnemy.y;
            
            // Add to chain
            chainedEnemyIds.add(nearestEnemy);
            
            // Add visual effect
            game.chainEffects.push({
                x1: currentX, y1: currentY,
                x2: enemyX, y2: enemyY,
                created: Date.now(),
                alpha: 1
            });
            
            // Update position for next chain
            currentX = enemyX;
            currentY = enemyY;
            
            // Deal damage
            const isDead = nearestEnemy.takeDamage(damage, enemyX, enemyY, game.player.knockback);
            
            // Lifesteal from chain
            if (game.player.lifesteal > 0) {
                game.player.heal(damage * game.player.lifesteal);
            }
            
            if (isDead) {
                game.handleEnemyDeath(nearestEnemy, currentTime);
                const idx = game.enemies.indexOf(nearestEnemy);
                if (idx !== -1) game.enemies.splice(idx, 1);
            }
        }
    }
};
