// Player class

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.color = '#4a9eff';
        
        // Core Stats
        this.maxHp = 100;
        this.hp = 100;
        this.speed = 4;
        this.pickupRange = 50;
        
        // Combat Stats
        this.armor = 0;              // Damage reduction in %
        this.damageMultiplier = 1;   // Damage multiplier
        this.attackSpeedMultiplier = 1; // Attack speed multiplier
        this.critChance = 0;         // Crit chance (0-1)
        this.critDamage = GAME_BALANCE.player.baseCritMultiplier;       // Crit multiplier
        this.lifesteal = 0;          // % of damage as healing
        this.knockback = 1;          // Knockback multiplier
        this.explosionRadius = 1;    // Explosion radius multiplier
        this.projectileCount = 0;    // Extra projectiles
        this.pierce = 0;             // Extra pierce
        this.attackRange = 1;        // Weapon range multiplier
        
        // Utility Stats
        this.luck = 0;               // Drop bonus
        this.xpMultiplier = 1;       // XP multiplier
        this.goldMultiplier = 1;     // Gold multiplier
        this.dodge = 0;              // Dodge chance (0-1)
        this.thorns = 0;             // Reflect damage
        this.regen = 0;              // HP/s regeneration
        this.regenTimer = 0;
        
        // Weapons (limit 6 slots, can have multiple of same type)
        this.maxWeapons = 6;
        this.weapons = [new Weapon('pistol')];
        
        // Items (inventory)
        this.items = [];
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        
        // Invincibility frames
        this.invincibleUntil = 0;
        this.invincibleDuration = GAME_BALANCE.player.invincibilityMs;
    }

    update(keys, canvas, currentTime) {
        // HP regeneration
        if (this.regen > 0) {
            this.regenTimer += 16; // ~60fps
            if (this.regenTimer >= 1000) {
                this.heal(this.regen);
                this.regenTimer = 0;
            }
        }
        
        // Movement input
        this.vx = 0;
        this.vy = 0;
        
        if (keys['w'] || keys['arrowup']) this.vy = -1;
        if (keys['s'] || keys['arrowdown']) this.vy = 1;
        if (keys['a'] || keys['arrowleft']) this.vx = -1;
        if (keys['d'] || keys['arrowright']) this.vx = 1;
        
        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707;
            this.vy *= 0.707;
        }
        
        // Apply movement
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
        
        // Keep in bounds
        this.x = clamp(this.x, this.width / 2, canvas.width - this.width / 2);
        this.y = clamp(this.y, this.height / 2, canvas.height - this.height / 2);
    }
    
    // Calculate weapon position - spread evenly around player
    getWeaponPosition(weaponIndex, currentTime, target = null) {
        const weaponRadius = 25;
        const weaponCount = this.weapons.length;
        
        // Weapon position - spread evenly around player
        const spreadAngle = (Math.PI * 2 / weaponCount) * weaponIndex;
        
        // Weapon position relative to player (orbit around player)
        const posX = this.x + Math.cos(spreadAngle) * weaponRadius;
        const posY = this.y + Math.sin(spreadAngle) * weaponRadius;
        
        // Aim angle - always at enemy (regardless of weapon position)
        let aimAngle = spreadAngle; // default in position direction
        if (target) {
            aimAngle = Math.atan2(target.y - posY, target.x - posX);
        }
        
        return {
            x: posX,
            y: posY,
            angle: aimAngle  // aim angle, not position!
        };
    }
    
    // Save last target for rendering
    setTarget(target) {
        this.currentTarget = target;
    }

    fireAllWeapons(mainTarget, currentTime, findEnemyFromFn) {
        if (!mainTarget && this.enemies?.length === 0) return [];
        
        // Save main target for rendering
        this.currentTarget = mainTarget;
        
        const allBullets = [];
        const weaponCount = this.weapons.length;
        
        for (let i = 0; i < weaponCount; i++) {
            const weapon = this.weapons[i];
            
            // Calculate weapon position
            const weaponPos = this.getWeaponPosition(i, currentTime, mainTarget);
            
            // Find nearest enemy from this weapon position (with range limit)
            let target = null;
            if (findEnemyFromFn) {
                const nearestToWeapon = findEnemyFromFn(weaponPos.x, weaponPos.y, weapon.range);
                if (nearestToWeapon) {
                    target = nearestToWeapon;
                }
            }
            
            // Fallback to main target if within range
            if (!target && mainTarget) {
                const dx = mainTarget.x - weaponPos.x;
                const dy = mainTarget.y - weaponPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= weapon.range * this.attackRange) {
                    target = mainTarget;
                }
            }
            
            if (!target) continue;
            
            const bullets = weapon.fire(
                weaponPos.x, weaponPos.y,  // Strzał z pozycji broni!
                target.x, target.y,
                currentTime,
                this.damageMultiplier,
                this.attackSpeedMultiplier,
                this.critChance,
                this.critDamage,
                this.projectileCount + weapon.extraProjectiles,  // Globalne + per-weapon bonus
                this.pierce
            );
            allBullets.push(...bullets);
        }
        return allBullets;
    }

    takeDamage(amount, currentTime) {
        if (currentTime < this.invincibleUntil) return false;
        
        // Dodge chance
        if (Math.random() < this.dodge) {
            // Dodged!
            return false;
        }
        
        // Armor reduction
        const reduction = this.armor / (this.armor + GAME_BALANCE.player.armorDiminishingFactor); // Diminishing returns
        const finalDamage = amount * (1 - reduction);
        
        this.hp = Math.max(0, this.hp - finalDamage); // Nie pozwól na ujemne HP
        this.invincibleUntil = currentTime + this.invincibleDuration;
        
        return this.hp <= 0;
    }
    
    // Return thorns damage
    getThorns() {
        return this.thorns;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    addWeapon(type) {
        // Check weapon limit
        if (this.weapons.length >= this.maxWeapons) {
            return false; // No room for new weapon
        }
        
        const weapon = new Weapon(type);
        this.weapons.push(weapon);
        
        // Recalculate fire offsets for staggered shooting
        this.recalculateFireOffsets();
        
        return true;
    }
    
    // Spread shots evenly for weapons of the same type
    recalculateFireOffsets() {
        // Group weapons by type
        const weaponsByType = {};
        for (const weapon of this.weapons) {
            if (!weaponsByType[weapon.type]) {
                weaponsByType[weapon.type] = [];
            }
            weaponsByType[weapon.type].push(weapon);
        }
        
        // Assign staggered offsets within each type group
        for (const type in weaponsByType) {
            const weapons = weaponsByType[type];
            const count = weapons.length;
            for (let i = 0; i < count; i++) {
                // Offset each weapon by fraction of fire rate
                weapons[i].fireOffset = (i / count) * weapons[i].fireRate;
            }
        }
    }

    render(ctx, currentTime, target = null) {
        // Save target if passed
        if (target) {
            this.currentTarget = target;
        }
        
        // Flash when invincible
        if (currentTime < this.invincibleUntil) {
            if (Math.floor(currentTime / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        
        // Armor visual (blue border if has armor)
        if (this.armor > 0) {
            ctx.strokeStyle = `rgba(100, 150, 255, ${Math.min(this.armor / 50, 1)})`;
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#2a7fff';
            ctx.lineWidth = 2;
        }
        ctx.strokeRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        
        // Eyes (direction indicator)
        ctx.fillStyle = 'white';
        const eyeOffset = 5;
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - 3, 4, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Render weapons around player
        this.renderWeapons(ctx, currentTime);
        
        ctx.globalAlpha = 1;
    }
    
    // Rendering weapons around player
    renderWeapons(ctx, currentTime) {
        // Delegated to WeaponRenderer (js/systems/weapon-renderer.js)
        WeaponRenderer.renderWeapons(ctx, this, currentTime);
    }
    
    // Add item
    addItem(itemId) {
        this.items.push(itemId);
    }
    
    // Count how many of given item you have
    countItem(itemId) {
        return this.items.filter(i => i === itemId).length;
    }

    // For collision
    get radius() {
        return this.width / 2;
    }
}
