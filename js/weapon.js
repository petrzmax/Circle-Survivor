// Weapon definitions and Bullet class

const WEAPON_TYPES = {
    pistol: {
        name: 'Pistolet',
        emoji: '🔫',
        fireRate: 500,
        damage: 10,
        bulletSpeed: 8,
        bulletCount: 1,
        spread: 0,
        price: 0,
        color: '#ffff00',
        range: 265,
        weaponCategory: 'gun'
    },
    smg: {
        name: 'SMG',
        emoji: '🔫',
        fireRate: 150,
        damage: 5,
        bulletSpeed: 10,
        bulletCount: 1,
        spread: 15,
        price: 50,
        color: '#ffa500',
        range: 215,
        weaponCategory: 'gun',
        knockbackMultiplier: 0.4
    },
    shotgun: {
        name: 'Shotgun',
        emoji: '💥',
        fireRate: 800,
        damage: 8,
        bulletSpeed: 7,
        bulletCount: 5,
        spread: 30,
        price: 80,
        color: '#ff4444',
        range: 140,
        weaponCategory: 'gun'
    },
    sniper: {
        name: 'Snajperka',
        emoji: '🎯',
        fireRate: 1500,
        damage: 50,
        bulletSpeed: 15,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        price: 100,
        color: '#00ffff',
        range: 400,
        weaponCategory: 'gun'
    },
    laser: {
        name: 'Laser',
        emoji: '⚡',
        fireRate: 100,
        damage: 3,
        bulletSpeed: 20,
        bulletCount: 1,
        spread: 5,
        price: 120,
        color: '#ff00ff',
        range: 350,
        weaponCategory: 'gun',
        knockbackMultiplier: 0.15
    },
    // NOWE BRONIE
    minigun: {
        name: 'Minigun',
        emoji: '🔥',
        fireRate: 50,       // Super szybki!
        damage: 2,          // Nerfed from 4
        bulletSpeed: 12,
        bulletCount: 1,
        spread: 20,
        price: 220,         // Increased from 150
        color: '#ff6600',
        range: 160,
        knockbackMultiplier: 0.3,  // Reduced knockback
        weaponCategory: 'gun'
    },
    bazooka: {
        name: 'Bazooka',
        emoji: '🚀',
        fireRate: 2000,
        damage: 80,
        bulletSpeed: 5,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 80,
        price: 180,
        color: '#ff0000',
        bulletRadius: 10,
        range: 310,
        weaponCategory: 'rocket'
    },
    flamethrower: {
        name: 'Miotacz Ognia',
        emoji: '🔥',
        fireRate: 80,
        damage: 2,
        bulletSpeed: 6,
        bulletCount: 3,
        spread: 40,
        price: 140,
        color: '#ff4400',
        bulletRadius: 6,
        shortRange: true,
        maxDistance: 120,
        range: 120,
        weaponCategory: 'special',
        knockbackMultiplier: 0
    },
    mines: {
        name: 'Miny',
        emoji: '💣',
        fireRate: 4500,
        damage: 60,
        bulletSpeed: 0,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 70,
        price: 130,
        color: '#333333',
        bulletRadius: 12,
        isMine: true,
        range: 9999,  // Mines don't need range limit
        weaponCategory: 'special'
    },
    nuke: {
        name: 'Wyrzutnia Nuklearna',
        emoji: '☢️',
        fireRate: 8000,
        damage: 300,
        bulletSpeed: 3,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 200,
        price: 500,
        color: '#00ff00',
        bulletRadius: 15,
        isNuke: true,
        range: 9999,  // Nuke shoots at any distance
        weaponCategory: 'rocket'
    },
    
    // === NOWE BRONIE ===
    scythe: {
        name: 'Kosa Kubusia',
        emoji: '🌙',
        fireRate: 1200,
        damage: 35,
        bulletSpeed: 6,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        pierceCount: 10,
        price: 200,
        color: '#9932cc',
        bulletRadius: 20,
        isScythe: true,  // Obraca się!
        range: 230,
        weaponCategory: 'melee'
    },
    sword: {
        name: 'Miecz Kamilka',
        emoji: '⚔️',
        fireRate: 700,
        damage: 10,
        bulletSpeed: 12,
        bulletCount: 3,
        spread: 60,
        price: 180,
        color: '#silver',
        bulletRadius: 8,
        isSword: true,
        shortRange: true,
        maxDistance: 100,
        range: 100,
        weaponCategory: 'melee',
        knockbackMultiplier: 0.3
    },
    holyGrenade: {
        name: 'Święty Granat',
        emoji: '✝️',
        fireRate: 3000,
        damage: 150,
        bulletSpeed: 4,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 120,
        price: 250,
        color: '#ffd700',
        bulletRadius: 12,
        isHolyGrenade: true,  // Specjalna eksplozja!
        range: 275,
        weaponCategory: 'grenade',
        explosiveRange: 275
    },
    banana: {
        name: 'Banan z Worms',
        emoji: '🍌',
        fireRate: 2500,
        damage: 40,
        bulletSpeed: 5,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 90,
        price: 220,
        color: '#ffff00',
        bulletRadius: 10,
        isBanana: true,  // Dzieli się na mniejsze!
        range: 235,
        weaponCategory: 'grenade',
        explosiveRange: 235
    },
    crossbow: {
        name: 'Kusza Przebijająca',
        emoji: '🏹',
        fireRate: 1000,
        damage: 60,
        bulletSpeed: 14,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        pierceCount: 5,
        price: 280,
        color: '#8b4513',
        bulletRadius: 6,
        range: 320,
        weaponCategory: 'gun'
    },
    
    // === WEWNĘTRZNY TYP - mini banan ===
    minibanana: {
        name: 'Mini Banan',
        emoji: '🍌',
        fireRate: 0,
        damage: 16,           // 40% z 40
        bulletSpeed: 8,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 45,  // 50% z 90
        price: 0,
        color: '#ffff00',
        bulletRadius: 6,
        isBanana: true,
        isMini: true,
        range: 80,
        weaponCategory: 'grenade',
        explosiveRange: 80
    }
};

class Weapon {
    constructor(type) {
        const config = WEAPON_TYPES[type];
        this.type = type;
        this.name = config.name;
        this.emoji = config.emoji;
        this.fireRate = config.fireRate;
        this.baseDamage = config.damage;
        this.damage = config.damage;
        this.bulletSpeed = config.bulletSpeed;
        this.bulletCount = config.bulletCount;
        this.spread = config.spread;
        this.pierce = config.pierce || false;
        this.pierceCount = config.pierceCount || (config.pierce ? 999 : 0);
        this.color = config.color;
        this.lastFired = 0;
        this.level = 1;
        
        // Nowe właściwości
        this.explosive = config.explosive || false;
        this.explosionRadius = config.explosionRadius || 0;
        this.bulletRadius = config.bulletRadius || 4;
        this.isMine = config.isMine || false;
        this.isNuke = config.isNuke || false;
        this.shortRange = config.shortRange || false;
        this.maxDistance = config.maxDistance || Infinity;
        
        // Range system
        this.range = config.range || 300;  // Default range
        this.knockbackMultiplier = config.knockbackMultiplier || 1;  // Per-weapon knockback
        
        // Fire offset for staggered shooting (set by player)
        this.fireOffset = 0;
        
        // Bonus z przedmiotów (per-weapon)
        this.extraProjectiles = 0;  // Dodatkowe pociski z multishot
        
        // Specjalne efekty
        this.chain = config.chain || false;      // Kusza łańcuchowa
        this.chainCount = config.chainCount || 0;
        this.isScythe = config.isScythe || false; // Kosa
        this.isSword = config.isSword || false;   // Miecz
        this.isBanana = config.isBanana || false; // Banan
        this.isHolyGrenade = config.isHolyGrenade || false;
    }

    canFire(currentTime) {
        // Include fire offset for staggered shooting
        return currentTime - this.lastFired >= this.fireRate + this.fireOffset;
    }
    
    // Reset offset after first shot (so subsequent shots use normal timing)
    resetOffset() {
        this.fireOffset = 0;
    }
    
    // Ulepsz broń
    upgrade() {
        this.level++;
        this.damage = this.baseDamage * (1 + (this.level - 1) * 0.3);
        this.fireRate = Math.round(this.fireRate * 0.9);  // +10% szybkości ataku
        if (this.explosive) {
            this.explosionRadius *= 1.15;
        }
    }
    
    // Dźwięk strzału w zależności od typu broni
    playShootSound() {
        if (typeof audio === 'undefined') return;
        
        switch (this.type) {
            case 'shotgun':
                audio.shootShotgun();
                break;
            case 'sniper':
                audio.shootSniper();
                break;
            case 'laser':
                audio.shootLaser();
                break;
            case 'minigun':
                audio.shootMinigun();
                break;
            case 'flamethrower':
                audio.flamethrower();
                break;
            case 'scythe':
                audio.scytheSwing();
                break;
            case 'sword':
                audio.swordSlash();
                break;
            case 'crossbow':
                audio.crossbowShoot();
                break;
            case 'bazooka':
            case 'nuke':
            case 'mines':
            case 'holyGrenade':
            case 'banana':
                // Eksplozja gra przy trafieniu, nie przy strzale
                audio.shoot();
                break;
            default:
                audio.shoot();
        }
    }

    fire(x, y, targetX, targetY, currentTime, damageMultiplier, attackSpeedMultiplier, critChance = 0, critDamage = 1.5, extraProjectiles = 0, extraPierce = 0) {
        if (!this.canFire(currentTime)) return [];

        // Wyższy attackSpeedMultiplier = szybszy atak = krótszy cooldown
        const effectiveFireRate = this.fireRate / attackSpeedMultiplier;
        this.lastFired = currentTime - (this.fireRate - effectiveFireRate);
        
        // Reset offset after first shot (staggering only applies to initial burst)
        this.fireOffset = 0;
        
        // Dźwięk strzału
        this.playShootSound();
        
        const bullets = [];
        const baseAngle = Math.atan2(targetY - y, targetX - x);
        const totalBullets = this.bulletCount + extraProjectiles;

        for (let i = 0; i < totalBullets; i++) {
            let angle = baseAngle;
            
            if (totalBullets > 1) {
                // Spread bullets evenly
                const spreadRad = (this.spread * Math.PI) / 180;
                angle = baseAngle - spreadRad / 2 + (spreadRad / (totalBullets - 1)) * i;
            } else if (this.spread > 0) {
                // Random spread for single bullet
                const spreadRad = ((Math.random() - 0.5) * this.spread * Math.PI) / 180;
                angle += spreadRad;
            }
            
            // Critical hit
            let finalDamage = this.damage * damageMultiplier;
            let isCrit = false;
            if (Math.random() < critChance) {
                finalDamage *= critDamage;
                isCrit = true;
            }

            const bullet = new Bullet(
                x, y,
                Math.cos(angle) * this.bulletSpeed,
                Math.sin(angle) * this.bulletSpeed,
                finalDamage,
                this.color,
                this.pierce || extraPierce > 0
            );
            
            // Dodaj specjalne właściwości
            bullet.radius = this.bulletRadius;
            bullet.explosive = this.explosive;
            bullet.explosionRadius = this.explosionRadius;
            bullet.isMine = this.isMine;
            bullet.isNuke = this.isNuke;
            bullet.shortRange = this.shortRange;
            bullet.maxDistance = this.maxDistance;
            bullet.distanceTraveled = 0;
            bullet.startX = x;
            bullet.startY = y;
            bullet.isCrit = isCrit;
            bullet.pierceCount = this.pierceCount + extraPierce;
            
            // Specjalne efekty broni
            bullet.chain = this.chain;
            bullet.chainCount = this.chainCount;
            bullet.isScythe = this.isScythe;
            bullet.isSword = this.isSword;
            bullet.isBanana = this.isBanana;
            bullet.isHolyGrenade = this.isHolyGrenade;
            bullet.knockbackMultiplier = this.knockbackMultiplier;
            
            // Kategoria broni i explosiveRange dla granatów
            bullet.weaponCategory = WEAPON_TYPES[this.type]?.weaponCategory || 'gun';
            bullet.explosiveRange = WEAPON_TYPES[this.type]?.explosiveRange || 0;
            bullet.isMini = WEAPON_TYPES[this.type]?.isMini || false;
            
            bullets.push(bullet);
        }

        return bullets;
    }
}

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
        
        // Specjalne właściwości (ustawiane przez Weapon)
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
        
        // Granaty (weaponCategory === 'grenade') - płynne hamowanie
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
