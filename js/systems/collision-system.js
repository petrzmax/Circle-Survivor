// Collision detection and handling system
// Provides collision checking between game entities

const CollisionSystem = {
    /**
     * Check bullets vs enemies collisions
     * @param {Game} game - Game instance
     * @param {number} currentTime - Current timestamp
     */
    checkBulletEnemyCollisions(game, currentTime) {
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const bullet = game.bullets[i];
            
            // Check collision with enemies
            let bulletHit = false;
            for (let j = game.enemies.length - 1; j >= 0; j--) {
                const enemy = game.enemies[j];
                
                if (bullet.pierce && bullet.hitEnemies.has(enemy)) continue;
                
                // Miny tylko gdy uzbrojone
                if (bullet.isMine && !bullet.mineArmed) continue;
                
                if (circleCollision(bullet, enemy)) {
                    // Explosive bullets damage all enemies in radius
                    if (bullet.explosive) {
                        const expRadius = bullet.explosionRadius * game.player.explosionRadius;
                        game.handleExplosion(bullet.x, bullet.y, expRadius, bullet.damage, bullet.isNuke, bullet.isHolyGrenade, bullet.isBanana, currentTime, bullet.isMini);
                        game.bullets.splice(i, 1);
                        bulletHit = true;
                        break;
                    }
                    
                    const isDead = enemy.takeDamage(bullet.damage, bullet.x, bullet.y, game.player.knockback * bullet.knockbackMultiplier);
                    
                    // Chain effect (crossbow) - przekaż pozycję, nie wroga!
                    if (bullet.chain && bullet.chainCount > 0) {
                        game.handleChainEffect(enemy.x, enemy.y, bullet.damage * 0.5, bullet.chainCount, currentTime);
                    }
                    
                    // Lifesteal
                    if (game.player.lifesteal > 0) {
                        game.player.heal(bullet.damage * game.player.lifesteal);
                    }
                    
                    if (bullet.pierce) {
                        bullet.hitEnemies.add(enemy);
                        // Check pierce count
                        if (bullet.pierceCount && bullet.hitEnemies.size >= bullet.pierceCount) {
                            game.bullets.splice(i, 1);
                            bulletHit = true;
                        }
                    } else {
                        game.bullets.splice(i, 1);
                        bulletHit = true;
                    }
                    
                    if (isDead) {
                        game.handleEnemyDeath(enemy, currentTime);
                        // Sprawdź czy wróg jeszcze istnieje w tablicy (mógł być usunięty przez chain)
                        const enemyIdx = game.enemies.indexOf(enemy);
                        if (enemyIdx !== -1) {
                            game.enemies.splice(enemyIdx, 1);
                        }
                    }
                    
                    if (bulletHit) break;
                }
            }
        }
    },
    
    /**
     * Check enemy bullets vs player collisions
     * @param {Game} game - Game instance
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if player died
     */
    checkEnemyBulletPlayerCollisions(game, currentTime) {
        for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = game.enemyBullets[i];
            
            // Check collision with player
            if (circleCollision(bullet, game.player)) {
                // Dodge chance
                if (game.player.dodge > 0 && Math.random() < game.player.dodge) {
                    audio.dodge();
                    game.enemyBullets.splice(i, 1);
                    continue;
                }
                
                const isDead = game.player.takeDamage(bullet.damage, currentTime);
                audio.playerHit();
                game.enemyBullets.splice(i, 1);
                
                if (isDead) {
                    return true; // Player died
                }
            }
        }
        return false;
    },
    
    /**
     * Check enemies vs player collisions (contact damage)
     * @param {Game} game - Game instance
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if player died
     */
    checkEnemyPlayerCollisions(game, currentTime) {
        for (let j = game.enemies.length - 1; j >= 0; j--) {
            const enemy = game.enemies[j];
            
            // Check collision with player
            if (circleCollision(enemy, game.player)) {
                // Dodge chance
                if (game.player.dodge > 0 && Math.random() < game.player.dodge) {
                    // Dodged! Show visual effect
                    audio.dodge();
                    continue;
                }
                
                // Boss zadaje x1.25 obrażenia przy dotknięciu
                let damage = enemy.damage;
                if (enemy.isBoss) {
                    damage *= 1.25;
                }
                
                const isDead = game.player.takeDamage(damage, currentTime);
                audio.playerHit();
                
                // Thorns damage
                if (game.player.thorns > 0) {
                    audio.thorns();
                    const thornsIsDead = enemy.takeDamage(game.player.thorns, enemy.x, enemy.y, game.player.knockback);
                    if (thornsIsDead) {
                        game.handleEnemyDeath(enemy, currentTime);
                        game.enemies.splice(j, 1);
                    }
                }
                
                if (isDead) {
                    return true; // Player died
                }
            }
        }
        return false;
    },
    
    /**
     * Check pickups vs player collisions
     * @param {Game} game - Game instance
     */
    checkPickupCollisions(game) {
        for (let i = game.pickups.length - 1; i >= 0; i--) {
            const pickup = game.pickups[i];
            
            // Usuń wygasłe pickupy (złoto po 7 sekundach)
            if (pickup.isExpired()) {
                game.pickups.splice(i, 1);
                continue;
            }
            
            const collected = pickup.update(game.player);
            
            if (collected) {
                if (pickup.type === 'gold') {
                    game.gold += Math.floor(pickup.value * game.player.goldMultiplier);
                    audio.collectGold();
                } else if (pickup.type === 'health') {
                    game.player.heal(pickup.value);
                    audio.collectHealth();
                }
                game.pickups.splice(i, 1);
            }
        }
    }
};
