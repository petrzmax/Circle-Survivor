// Effects system - handles visual effects like explosions, particles, chains
// Rendering and updating of temporary visual effects

const EffectsSystem = {
    /**
     * Update shockwaves (boss attack effect)
     * @param {Game} game - Game instance
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if player died from shockwave
     */
    updateShockwaves(game, currentTime) {
        if (!game.shockwaves) return false;
        
        for (let i = game.shockwaves.length - 1; i >= 0; i--) {
            const sw = game.shockwaves[i];
            const age = Date.now() - sw.created;
            const duration = 400; // ms
            
            // Expand ring
            sw.currentRadius = sw.maxRadius * Math.min(1, age / (duration * 0.7));
            sw.alpha = 1 - (age / duration);
            
            // Deal damage to player when wave reaches them (only once)
            if (!sw.damageDealt) {
                const distToPlayer = distance({x: sw.x, y: sw.y}, game.player);
                if (distToPlayer <= sw.currentRadius && distToPlayer >= sw.currentRadius - 30) {
                    // Player in wave range
                    if (game.player.dodge > 0 && Math.random() < game.player.dodge) {
                        audio.dodge();
                    } else {
                        const isDead = game.player.takeDamage(sw.damage, currentTime);
                        if (isDead) return true;
                    }
                    sw.damageDealt = true;
                }
            }
            
            // Remove finished ones
            if (sw.alpha <= 0) {
                game.shockwaves.splice(i, 1);
            }
        }
        return false;
    },
    
    /**
     * Render explosions
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} explosions - Array of explosion effects
     */
    renderExplosions(ctx, explosions) {
        if (!explosions) return;
        
        for (let i = explosions.length - 1; i >= 0; i--) {
            const exp = explosions[i];
            const age = Date.now() - exp.created;
            const duration = exp.isNuke ? 600 : 300;
            exp.alpha = 1 - (age / duration);
            
            if (exp.alpha <= 0) {
                explosions.splice(i, 1);
                continue;
            }
            
            ctx.save();
            ctx.globalAlpha = exp.alpha;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius * (1 - exp.alpha * 0.3), 0, Math.PI * 2);
            
            if (exp.isNuke) {
                // Nuke - green explosion with multiple rings
                const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#00ff00');
                gradient.addColorStop(0.6, '#008800');
                gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
                // Second ring
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, exp.radius * 0.6 * (1 - exp.alpha * 0.5), 0, Math.PI * 2);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 5;
                ctx.stroke();
            } else if (exp.isHolyGrenade) {
                // Holy Grenade - golden holy explosion
                const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#ffdd00');
                gradient.addColorStop(0.6, '#ffaa00');
                gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
                // Luminous cross
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(exp.x, exp.y - exp.radius * 0.5);
                ctx.lineTo(exp.x, exp.y + exp.radius * 0.5);
                ctx.moveTo(exp.x - exp.radius * 0.4, exp.y);
                ctx.lineTo(exp.x + exp.radius * 0.4, exp.y);
                ctx.stroke();
            } else if (exp.isBanana) {
                // Banana bomb - yellow explosion
                const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(0.4, '#ffcc00');
                gradient.addColorStop(0.7, '#ff6600');
                gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            } else {
                // Normal explosion
                ctx.fillStyle = '#ffff00';
                ctx.fill();
                ctx.strokeStyle = '#ff8800';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
        }
    },
    
    /**
     * Render chain lightning effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} chainEffects - Array of chain effects
     */
    renderChainEffects(ctx, chainEffects) {
        if (!chainEffects) return;
        
        for (let i = chainEffects.length - 1; i >= 0; i--) {
            const chain = chainEffects[i];
            const age = Date.now() - chain.created;
            const duration = 300;
            chain.alpha = 1 - (age / duration);
            
            if (chain.alpha <= 0) {
                chainEffects.splice(i, 1);
                continue;
            }
            
            ctx.save();
            ctx.globalAlpha = chain.alpha;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(chain.x1, chain.y1);
            ctx.lineTo(chain.x2, chain.y2);
            ctx.stroke();
            ctx.restore();
        }
    },
    
    /**
     * Render death particle effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} deathEffects - Array of death particle effects
     */
    renderDeathEffects(ctx, deathEffects) {
        if (!deathEffects) return;
        
        for (let i = deathEffects.length - 1; i >= 0; i--) {
            const p = deathEffects[i];
            
            // Update position and life
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95; // Friction
            p.vy *= 0.95;
            p.life -= p.decay;
            p.alpha = p.life;
            
            if (p.life <= 0) {
                deathEffects.splice(i, 1);
                continue;
            }
            
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            
            if (p.isBoss) {
                // Boss particles with glow
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    
    /**
     * Render shockwave effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} shockwaves - Array of shockwave effects
     */
    renderShockwaves(ctx, shockwaves) {
        if (!shockwaves) return;
        
        for (const sw of shockwaves) {
            if (sw.alpha <= 0) continue;
            
            ctx.save();
            ctx.globalAlpha = sw.alpha * 0.6;
            
            // Outer ring (expanding)
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = sw.color || '#ff4444';
            ctx.lineWidth = 8;
            ctx.shadowColor = sw.color || '#ff4444';
            ctx.shadowBlur = 20;
            ctx.stroke();
            
            // Inner ring
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.currentRadius * 0.7, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.restore();
        }
    },
    
    /**
     * Create death particle effect for enemy
     * @param {Game} game - Game instance
     * @param {Enemy} enemy - Enemy that died
     */
    createDeathEffect(game, enemy) {
        if (!game.deathEffects) game.deathEffects = [];
        
        // Particle count depends on enemy type
        let particleCount = 8;
        let particleSize = 4;
        let particleColor = enemy.color;
        
        if (enemy.isBoss) {
            particleCount = 30;
            particleSize = 8;
        } else if (enemy.type === 'tank' || enemy.type === 'brute') {
            particleCount = 15;
            particleSize = 6;
        } else if (enemy.type === 'swarm') {
            particleCount = 5;
            particleSize = 3;
        }
        
        // Creating particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            
            game.deathEffects.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: particleSize * (0.5 + Math.random() * 0.5),
                color: particleColor,
                alpha: 1,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                isBoss: enemy.isBoss
            });
        }
        
        // Additional effect for boss - second wave of larger particles
        if (enemy.isBoss) {
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                
                game.deathEffects.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 10 + Math.random() * 10,
                    color: '#FFD700', // Golden color
                    alpha: 1,
                    life: 1,
                    decay: 0.01,
                    isBoss: true
                });
            }
        }
    },
    
    /**
     * Create explosion visual effect
     * @param {Game} game - Game instance
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Explosion radius
     * @param {boolean} isNuke - Is nuke explosion
     * @param {boolean} isHolyGrenade - Is holy grenade explosion
     * @param {boolean} isBanana - Is banana explosion
     */
    createExplosion(game, x, y, radius, isNuke = false, isHolyGrenade = false, isBanana = false) {
        if (!game.explosions) game.explosions = [];
        game.explosions.push({
            x, y, radius,
            maxRadius: radius,
            alpha: 1,
            created: Date.now(),
            isNuke: isNuke,
            isHolyGrenade: isHolyGrenade,
            isBanana: isBanana
        });
    },
    
    /**
     * Create shockwave effect (boss attack)
     * @param {Game} game - Game instance
     * @param {Object} shockwave - Shockwave data
     */
    createShockwave(game, shockwave) {
        if (!game.shockwaves) game.shockwaves = [];
        
        // Sound
        audio.explosion();
        
        game.shockwaves.push({
            x: shockwave.x,
            y: shockwave.y,
            maxRadius: shockwave.radius,
            currentRadius: 0,
            damage: shockwave.damage,
            color: shockwave.color,
            created: Date.now(),
            damageDealt: false
        });
    },
    
    /**
     * Render all effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Game} game - Game instance
     */
    renderAll(ctx, game) {
        this.renderExplosions(ctx, game.explosions);
        this.renderChainEffects(ctx, game.chainEffects);
        this.renderDeathEffects(ctx, game.deathEffects);
        this.renderShockwaves(ctx, game.shockwaves);
    }
};
