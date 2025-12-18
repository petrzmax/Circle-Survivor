// Bullet class (player projectiles)

class Bullet {
    constructor(x, y, vx, vy, damage, color, pierce = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.radius = 4;
        this.pierce = pierce;
        this.hitEnemies = new Set();
        
        // Knockback multiplier from weapon
        this.knockbackMultiplier = 1;
        
        // Special properties (set by Weapon)
        this.explosive = false;
        this.explosionRadius = 0;
        this.isMine = false;
        this.isNuke = false;
        this.shortRange = false;
        this.maxDistance = Infinity;
        this.distanceTraveled = 0;
        this.startX = x;
        this.startY = y;
        this.mineTimer = 0;
        this.mineArmed = false;
        
        // Dla granatów - hamowanie i wybuch po dystansie
        this.weaponCategory = 'gun';
        this.explosiveRange = 0;
        this.shouldExplodeOnExpire = false;
        this.isMini = false;
        this.baseSpeed = Math.sqrt(vx * vx + vy * vy);
    }

    update() {
        // Miny nie lecą, tylko czekają
        if (this.isMine) {
            this.mineTimer++;
            if (this.mineTimer > 30) this.mineArmed = true; // Arm after 0.5s
            return;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Track distance traveled
        this.distanceTraveled = Math.sqrt(
            (this.x - this.startX) ** 2 + 
            (this.y - this.startY) ** 2
        );
        
        // Grenades (weaponCategory === 'grenade') - smooth slowdown
        if (this.weaponCategory === 'grenade' && this.explosiveRange > 0) {
            const progress = this.distanceTraveled / this.explosiveRange;
            
            if (progress > 0.7 && progress < 1) {
                // Ease-out: prędkość spada od 100% do ~10% w ostatnich 30%
                const slowdownProgress = (progress - 0.7) / 0.3;
                const speedMultiplier = Math.max(0.1, 1 - (slowdownProgress * 0.9));
                
                // Normalizuj kierunek i zastosuj nową prędkość
                const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (currentSpeed > 0.1) {
                    const targetSpeed = this.baseSpeed * speedMultiplier;
                    const scale = targetSpeed / currentSpeed;
                    this.vx *= scale;
                    this.vy *= scale;
                }
            }
            
            if (progress >= 1) {
                this.shouldExplodeOnExpire = true;
            }
        }
    }
    
    shouldExpire() {
        // Granaty wybuchają po dystansie
        if (this.shouldExplodeOnExpire) {
            return true;
        }
        
        // Short range bullets expire after max distance
        if (this.shortRange && this.distanceTraveled > this.maxDistance) {
            return true;
        }
        return false;
    }

    render(ctx) {
        ctx.save();
        
        // Różne renderowanie dla różnych typów
        if (this.isNuke) {
            // Nuke - duża świecąca kula z symbolem
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(1, '#004400');
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 20;
            ctx.fill();
        } else if (this.isMine) {
            // Mina - ciemna z czerwonym światełkiem
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (this.mineArmed) {
                ctx.beginPath();
                ctx.arc(this.x, this.y - 3, 3, 0, Math.PI * 2);
                ctx.fillStyle = Math.floor(Date.now() / 200) % 2 ? '#ff0000' : '#440000';
                ctx.fill();
            }
        } else if (this.isScythe) {
            // Kosa Kubusia - obracająca się kosa
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 100);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 1.5);
            ctx.lineTo(0, 0);
            ctx.fillStyle = '#9932cc';
            ctx.fill();
            ctx.strokeStyle = '#660099';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowColor = '#9932cc';
            ctx.shadowBlur = 15;
        } else if (this.isSword) {
            // Miecz Kamilka - błyskawiczny slash
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, -3);
            ctx.lineTo(this.radius + 5, 0);
            ctx.lineTo(this.radius, 3);
            ctx.closePath();
            ctx.fillStyle = '#c0c0c0';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.isHolyGrenade) {
            // Święty granat - złoty z krzyżem
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffd700');
            gradient.addColorStop(1, '#b8860b');
            ctx.fillStyle = gradient;
            ctx.fill();
            // Krzyż
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 5);
            ctx.lineTo(this.x, this.y + 5);
            ctx.moveTo(this.x - 4, this.y - 1);
            ctx.lineTo(this.x + 4, this.y - 1);
            ctx.stroke();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
        } else if (this.isBanana) {
            // Banan z Worms - żółty banan
            ctx.translate(this.x, this.y);
            ctx.rotate(Date.now() / 150);
            ctx.beginPath();
            ctx.arc(0, -5, this.radius, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#ffff00';
            ctx.stroke();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#cccc00';
            ctx.stroke();
        } else if (this.chain) {
            // Kusza - strzała z łańcuchem
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            // Strzała
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(this.radius + 4, -2);
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(this.radius + 4, 2);
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Świecący hak
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.radius, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.explosive && !this.isMine) {
            // Bazooka rocket
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.7, '#ff4400');
            gradient.addColorStop(1, '#aa0000');
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 4;
            ctx.stroke();
        } else {
            // Standard bullet
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Crit indicator
            if (this.isCrit) {
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
            }
            ctx.fill();
        }
        
        ctx.restore();
    }

    isOffScreen(canvas) {
        if (this.isMine) return false;
        return this.x < -50 || this.x > canvas.width + 50 ||
               this.y < -50 || this.y > canvas.height + 50;
    }
}
