// Weapon class and Bullet class
// WEAPON_TYPES moved to js/config/weapons-config.js

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

// Bullet class moved to js/entities/bullet.js
