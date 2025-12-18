// Enemy classes
// ENEMY_TYPES, BOSS_NAME_PREFIXES, BOSS_NAME_SUFFIXES, generateBossName() moved to js/config/enemies-config.js

class Enemy {
    constructor(x, y, type = 'basic') {
        const config = ENEMY_TYPES[type];
        
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = config.color;
        this.radius = config.radius;
        this.speed = config.speed;
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.damage = config.damage;
        this.xpValue = config.xpValue;
        this.goldValue = config.goldValue;
        
        // Special properties
        this.zigzag = config.zigzag || false;
        this.explodeOnDeath = config.explodeOnDeath || false;
        this.explosionRadius = config.explosionRadius || 0;
        this.explosionDamage = config.explosionDamage || 0;
        this.splitOnDeath = config.splitOnDeath || false;
        this.splitCount = config.splitCount || 0;
        this.isBoss = config.isBoss || false;
        this.phasing = config.phasing || false;
        
        // Boss name
        if (this.isBoss) {
            this.bossName = generateBossName();
            // Boss spawn sound
            if (typeof audio !== 'undefined') {
                audio.bossSpawn();
            }
        }
        
        // Shooting properties (for bosses)
        this.canShoot = config.canShoot || false;
        this.fireRate = config.fireRate || 2000;
        this.bulletSpeed = config.bulletSpeed || 4;
        this.bulletDamage = config.bulletDamage || 15;
        this.lastFireTime = 0;
        this.attackPatterns = config.attackPatterns || ['single'];
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        
        // Zigzag timer
        this.zigzagTimer = 0;
        this.zigzagDir = 1;
        
        // Flag - whether enemy has entered arena (spawn is off-screen)
        this.hasEnteredArena = false;
    }

    update(player, deltaTime = 16, canvasWidth = 900, canvasHeight = 700) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            let moveX = (dx / dist) * this.speed;
            let moveY = (dy / dist) * this.speed;
            
            // Zigzag movement
            if (this.zigzag) {
                this.zigzagTimer += deltaTime;
                if (this.zigzagTimer > 200) {
                    this.zigzagTimer = 0;
                    this.zigzagDir *= -1;
                }
                // Perpendicular movement
                moveX += (-dy / dist) * this.speed * 0.8 * this.zigzagDir;
                moveY += (dx / dist) * this.speed * 0.8 * this.zigzagDir;
            }
            
            this.x += moveX + this.knockbackX;
            this.y += moveY + this.knockbackY;
        }
        
        // Reduce knockback
        this.knockbackX *= 0.8;
        this.knockbackY *= 0.8;
        
        // Check if enemy entered arena (fully inside)
        const isFullyInside = this.x > this.radius && this.x < canvasWidth - this.radius &&
                              this.y > this.radius && this.y < canvasHeight - this.radius;
        
        if (isFullyInside) {
            this.hasEnteredArena = true;
        }
        
        // Limit position only if enemy has entered arena
        if (this.hasEnteredArena) {
            this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        }
    }
    
    // Boss shooting at player - different attack patterns
    tryAttack(player, currentTime) {
        if (!this.canShoot) return null;
        if (currentTime - this.lastFireTime < this.fireRate) return null;
        
        this.lastFireTime = currentTime;
        
        // Random attack pattern
        const pattern = this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)];
        
        // Direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return null;
        
        const baseAngle = Math.atan2(dy, dx);
        
        switch (pattern) {
            case 'spread':
                // Fan shot - 5 bullets in 60° arc
                const spreadBullets = [];
                const spreadCount = 5;
                const spreadAngle = Math.PI / 3; // 60 stopni
                
                for (let i = 0; i < spreadCount; i++) {
                    const angle = baseAngle - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
                    const vx = Math.cos(angle) * this.bulletSpeed;
                    const vy = Math.sin(angle) * this.bulletSpeed;
                    spreadBullets.push(new EnemyBullet(this.x, this.y, vx, vy, this.bulletDamage * 0.6, this.color));
                }
                return { type: 'bullets', bullets: spreadBullets };
                
            case 'shockwave':
                // Shockwave - area attack
                return { 
                    type: 'shockwave', 
                    x: this.x, 
                    y: this.y, 
                    radius: this.radius * 3,  // Promień fali = 3x promień bossa
                    damage: this.bulletDamage * 1.5,
                    color: this.color
                };
                
            case 'single':
            default:
                // Single shot
                const vx = (dx / dist) * this.bulletSpeed;
                const vy = (dy / dist) * this.bulletSpeed;
                return { type: 'bullets', bullets: [new EnemyBullet(this.x, this.y, vx, vy, this.bulletDamage, this.color)] };
        }
    }
    
    // Keep old method for compatibility
    tryShoot(player, currentTime) {
        const result = this.tryAttack(player, currentTime);
        if (!result) return null;
        if (result.type === 'bullets' && result.bullets.length === 1) {
            return result.bullets[0];
        }
        return result;
    }

    takeDamage(amount, bulletX, bulletY, knockbackMultiplier = 1) {
        this.hp -= amount;
        
        // Knockback (less for bosses)
        const knockbackStrength = (this.isBoss ? GAME_BALANCE.boss.knockbackResistance : GAME_BALANCE.enemy.knockbackMultiplier) * knockbackMultiplier;
        const dx = this.x - bulletX;
        const dy = this.y - bulletY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.knockbackX = (dx / dist) * knockbackStrength;
            this.knockbackY = (dy / dist) * knockbackStrength;
        }
        
        return this.hp <= 0;
    }

    render(ctx) {
        ctx.save();
        
        // Ghost transparency
        if (this.phasing) {
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
        }
        
        // Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // HP bar (only if damaged, and not for bosses with top health bar)
        if (this.hp < this.maxHp && !this.hasTopHealthBar) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const hpPercent = this.hp / this.maxHp;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
            
            ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
        }
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.arc(this.x + this.radius * 0.3, this.y - this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eyebrows
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius * 0.5, this.y - this.radius * 0.4);
        ctx.lineTo(this.x - this.radius * 0.1, this.y - this.radius * 0.5);
        ctx.moveTo(this.x + this.radius * 0.5, this.y - this.radius * 0.4);
        ctx.lineTo(this.x + this.radius * 0.1, this.y - this.radius * 0.5);
        ctx.stroke();
        
        // Boss crown
        if (this.isBoss) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - this.radius - 5);
            ctx.lineTo(this.x - 15, this.y - this.radius - 20);
            ctx.lineTo(this.x - 5, this.y - this.radius - 10);
            ctx.lineTo(this.x, this.y - this.radius - 25);
            ctx.lineTo(this.x + 5, this.y - this.radius - 10);
            ctx.lineTo(this.x + 15, this.y - this.radius - 20);
            ctx.lineTo(this.x + 20, this.y - this.radius - 5);
            ctx.closePath();
            ctx.fill();
            
            // Boss name
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.bossName, this.x, this.y - this.radius - 35);
            ctx.fillStyle = '#ffd700';
            ctx.fillText(this.bossName, this.x, this.y - this.radius - 35);
        }
        
        // Exploder warning glow
        if (this.explodeOnDeath) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
        }
        
        ctx.restore();
    }
}

// EnemyBullet class moved to js/entities/enemy-bullet.js
// Pickup class moved to js/entities/pickup.js
