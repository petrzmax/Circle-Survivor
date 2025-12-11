// Enemy classes

// Generator nazw bossów
const BOSS_NAME_PREFIXES = [
    'Kieł', 'Opus', 'Miłośnik', 'Marcel', 'Władca', 'Pan', 'Pogromca',
    'Cień', 'Gniew', 'Strach', 'Żelazny', 'Krwawy', 'Złoty', 'Mroczny',
    'Szalony', 'Bezlitosny', 'Potężny', 'Wielki', 'Starożytny', 'Niszczyciel'
];

const BOSS_NAME_SUFFIXES = [
    'Beredy', 'Radzimirskiego', 'Biznesu', 'Kustosz', 'Nocy', 'Chaosu',
    'Ciemności', 'Zniszczenia', 'Śmierci', 'Otchłani', 'Piekła', 'Zagłady',
    'Burzy', 'Cieni', 'Krwi', 'Gromu', 'Wieczności', 'Pożogi', 'Zarazy', 'Koszmaru'
];

function generateBossName() {
    const prefix = BOSS_NAME_PREFIXES[Math.floor(Math.random() * BOSS_NAME_PREFIXES.length)];
    const suffix = BOSS_NAME_SUFFIXES[Math.floor(Math.random() * BOSS_NAME_SUFFIXES.length)];
    return `${prefix} ${suffix}`;
}

const ENEMY_TYPES = {
    // Podstawowe
    basic: {
        name: 'Basic',
        color: '#e94560',
        radius: 15,
        speed: 1.5,
        hp: 20,
        damage: 15,
        xpValue: 10,
        goldValue: 2
    },
    fast: {
        name: 'Fast',
        color: '#ff8c00',
        radius: 10,
        speed: 3.5,
        hp: 10,
        damage: 8,
        xpValue: 15,
        goldValue: 4
    },
    tank: {
        name: 'Tank',
        color: '#9b59b6',
        radius: 28,
        speed: 0.7,
        hp: 100,
        damage: 35,
        xpValue: 35,
        goldValue: 9
    },
    swarm: {
        name: 'Swarm',
        color: '#2ecc71',
        radius: 7,
        speed: 2.2,
        hp: 5,
        damage: 5,
        xpValue: 5,
        goldValue: 1
    },
    
    // Nowe typy
    sprinter: {
        name: 'Sprinter',
        color: '#00ffff',
        radius: 9,
        speed: 5,
        hp: 8,
        damage: 12,
        xpValue: 20,
        goldValue: 5
    },
    brute: {
        name: 'Brute',
        color: '#8b0000',
        radius: 35,
        speed: 0.5,
        hp: 200,
        damage: 60,
        xpValue: 60,
        goldValue: 15
    },
    ghost: {
        name: 'Ghost',
        color: 'rgba(255, 255, 255, 0.6)',
        radius: 14,
        speed: 2,
        hp: 15,
        damage: 20,
        xpValue: 25,
        goldValue: 6,
        phasing: true // Może być półprzezroczysty
    },
    exploder: {
        name: 'Exploder',
        color: '#ffff00',
        radius: 12,
        speed: 1.8,
        hp: 25,
        damage: 5,
        xpValue: 20,
        goldValue: 5,
        explodeOnDeath: true,
        explosionRadius: 60,
        explosionDamage: 15
    },
    zigzag: {
        name: 'Zigzag',
        color: '#ff69b4',
        radius: 11,
        speed: 2.5,
        hp: 18,
        damage: 8,
        xpValue: 18,
        goldValue: 4,
        zigzag: true
    },
    splitter: {
        name: 'Splitter',
        color: '#7cfc00',
        radius: 20,
        speed: 1.2,
        hp: 40,
        damage: 12,
        xpValue: 25,
        goldValue: 7,
        splitOnDeath: true,
        splitCount: 3
    },
    
    // ============ BOSSY ============
    boss: {
        name: 'BOSS',
        color: '#ff0000',
        radius: 50,
        speed: 0.4,
        hp: 500,
        damage: 50,
        xpValue: 200,
        goldValue: 50,
        isBoss: true,
        canShoot: true,
        fireRate: 2000,
        bulletSpeed: 4,
        bulletDamage: 20
    },
    bossSwarm: {
        name: 'BOSS',
        color: '#00ff00',
        radius: 45,
        speed: 0.6,
        hp: 400,
        damage: 30,
        xpValue: 250,
        goldValue: 60,
        isBoss: true,
        splitOnDeath: true,
        splitCount: 8,
        canShoot: true,
        fireRate: 1500,
        bulletSpeed: 5,
        bulletDamage: 10
    },
    bossTank: {
        name: 'BOSS',
        color: '#8b00ff',
        radius: 65,
        speed: 0.25,
        hp: 1000,
        damage: 80,
        xpValue: 300,
        goldValue: 75,
        isBoss: true,
        canShoot: true,
        fireRate: 3000,
        bulletSpeed: 3,
        bulletDamage: 35
    },
    bossSpeed: {
        name: 'BOSS',
        color: '#00ffff',
        radius: 40,
        speed: 1.2,
        hp: 350,
        damage: 35,
        xpValue: 220,
        goldValue: 55,
        isBoss: true,
        zigzag: true,
        canShoot: true,
        fireRate: 800,
        bulletSpeed: 7,
        bulletDamage: 12
    },
    bossExploder: {
        name: 'BOSS',
        color: '#ffff00',
        radius: 55,
        speed: 0.35,
        hp: 600,
        damage: 40,
        xpValue: 280,
        goldValue: 70,
        isBoss: true,
        explodeOnDeath: true,
        explosionRadius: 150,
        explosionDamage: 50,
        canShoot: true,
        fireRate: 2500,
        bulletSpeed: 4,
        bulletDamage: 25
    },
    bossGhost: {
        name: 'BOSS',
        color: 'rgba(255, 255, 255, 0.7)',
        radius: 48,
        speed: 0.55,
        hp: 450,
        damage: 45,
        xpValue: 260,
        goldValue: 65,
        isBoss: true,
        phasing: true,
        canShoot: true,
        fireRate: 1800,
        bulletSpeed: 5,
        bulletDamage: 18
    }
};
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
            // Dźwięk pojawienia się bossa
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
        
        // Knockback
        this.knockbackX = 0;
        this.knockbackY = 0;
        
        // Zigzag timer
        this.zigzagTimer = 0;
        this.zigzagDir = 1;
    }

    update(player, deltaTime = 16) {
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
    }
    
    // Strzelanie bossa do gracza
    tryShoot(player, currentTime) {
        if (!this.canShoot) return null;
        if (currentTime - this.lastFireTime < this.fireRate) return null;
        
        this.lastFireTime = currentTime;
        
        // Kierunek do gracza
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return null;
        
        const vx = (dx / dist) * this.bulletSpeed;
        const vy = (dy / dist) * this.bulletSpeed;
        
        return new EnemyBullet(this.x, this.y, vx, vy, this.bulletDamage, this.color);
    }

    takeDamage(amount, bulletX, bulletY, knockbackMultiplier = 1) {
        this.hp -= amount;
        
        // Knockback (less for bosses)
        const knockbackStrength = (this.isBoss ? 1 : 3) * knockbackMultiplier;
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
        
        // HP bar (only if damaged)
        if (this.hp < this.maxHp) {
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
            
            // Nazwa bossa
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

// Klasa pocisku wroga (bossa)
class EnemyBullet {
    constructor(x, y, vx, vy, damage, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.radius = 6;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    isOffScreen(canvas) {
        return this.x < -50 || this.x > canvas.width + 50 ||
               this.y < -50 || this.y > canvas.height + 50;
    }
    
    render(ctx) {
        ctx.save();
        
        // Poświata
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Główny pocisk
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Ciemniejszy środek
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        
        ctx.restore();
    }
}
// Pickup class (XP, Gold, Health)
class Pickup {
    constructor(x, y, type, value) {
        this.x = x;
        this.y = y;
        this.baseY = y; // Bazowa pozycja Y dla animacji
        this.type = type; // 'xp', 'gold', or 'health'
        this.value = value;
        this.radius = 8;
        this.magnetSpeed = 5;
        this.beingCollected = false;
        this.animationOffset = Math.random() * Math.PI * 2; // Losowy offset animacji
        this.spawnTime = Date.now();
        this.lifetime = this.type === 'gold' ? 4000 : 15000; // 4s dla złota, 15s dla health
        this.shrinkDuration = 1000; // Ostatnia 1 sekunda - kurczenie
    }
    
    isExpired() {
        // Health i gold znikają po czasie
        if (this.type !== 'gold' && this.type !== 'health') return false;
        if (this.beingCollected) return false; // Nie znikaj jak jest zbierane
        return Date.now() - this.spawnTime > this.lifetime;
    }
    
    // Zwraca skalę od 0 do 1 (1 = pełny rozmiar, 0 = zniknięty)
    getScale() {
        if (this.type !== 'gold' && this.type !== 'health') return 1;
        if (this.beingCollected) return 1;
        
        const age = Date.now() - this.spawnTime;
        const shrinkStart = this.lifetime - this.shrinkDuration;
        
        if (age < shrinkStart) return 1;
        
        // Płynne kurczenie w ostatniej sekundzie
        const shrinkProgress = (age - shrinkStart) / this.shrinkDuration;
        return Math.max(0, 1 - shrinkProgress);
    }

    update(player) {
        const dist = distance(this, player);
        
        // Animacja góra-dół (tylko gdy nie jest zbierane)
        if (!this.beingCollected) {
            const time = (Date.now() - this.spawnTime) / 1000;
            this.y = this.baseY + Math.sin(time * 3 + this.animationOffset) * 1.5;
        }
        
        // Magnet effect
        if (dist < player.pickupRange || this.beingCollected) {
            this.beingCollected = true;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const norm = normalize({ x: dx, y: dy });
            this.x += norm.x * this.magnetSpeed;
            this.y += norm.y * this.magnetSpeed;
            this.baseY = this.y; // Aktualizuj bazową pozycję
        }
        
        // Collect
        if (dist < player.radius) {
            return true;
        }
        return false;
    }

    render(ctx) {
        ctx.save();
        
        // Zastosuj skalę (animacja kurczenia dla złota)
        const scale = this.getScale();
        if (scale < 1) {
            ctx.globalAlpha = scale; // Też dodaj zanikanie przezroczystości
        }
        
        if (this.type === 'xp') {
            // Green diamond (XP) - już nie używane, ale zostawiam na wszelki wypadek
            ctx.fillStyle = '#2ecc71';
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
        } else if (this.type === 'gold') {
            // Delikatna poświata złota (tylko pod spodem)
            ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
            ctx.shadowBlur = 8 * scale;
            ctx.shadowOffsetY = 2;
            // Money bag emoji - z animacją kurczenia
            ctx.font = `${16 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💰', this.x, this.y);
        } else if (this.type === 'health') {
            // Zastosuj skalę dla health też
            const healthScale = this.getScale();
            if (healthScale < 1) {
                ctx.globalAlpha = healthScale;
            }
            
            // Red heart / cross for health - z poświatą
            ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
            ctx.shadowBlur = 10 * healthScale;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = '#ff4444';
            // Draw a heart shape
            ctx.translate(this.x, this.y);
            ctx.scale(healthScale, healthScale);
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.3);
            ctx.bezierCurveTo(-this.radius, -this.radius, -this.radius, this.radius * 0.5, 0, this.radius);
            ctx.bezierCurveTo(this.radius, this.radius * 0.5, this.radius, -this.radius, 0, -this.radius * 0.3);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
