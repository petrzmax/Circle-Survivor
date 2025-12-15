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
        this.armor = 0;              // Redukcja obrażeń w %
        this.damageMultiplier = 1;   // Mnożnik obrażeń
        this.attackSpeedMultiplier = 1; // Mnożnik szybkości ataku
        this.critChance = 0;         // Szansa na krytyka (0-1)
        this.critDamage = 1.5;       // Mnożnik krytyka
        this.lifesteal = 0;          // % obrażeń jako leczenie
        this.knockback = 1;          // Mnożnik odrzutu
        this.explosionRadius = 1;    // Mnożnik zasięgu eksplozji
        this.projectileCount = 0;    // Dodatkowe pociski
        this.pierce = 0;             // Dodatkowe przebicia
        this.attackRange = 1;        // Mnożnik zasięgu broni
        
        // Utility Stats
        this.luck = 0;               // Bonus do dropów
        this.xpMultiplier = 1;       // Mnożnik XP
        this.goldMultiplier = 1;     // Mnożnik złota
        this.dodge = 0;              // Szansa na unik (0-1)
        this.thorns = 0;             // Obrażenia zwrotne
        this.regen = 0;              // HP/s regeneracja
        this.regenTimer = 0;
        
        // Weapons (limit 6 slotów, można mieć wiele tej samej)
        this.maxWeapons = 6;
        this.weapons = [new Weapon('pistol')];
        
        // Przedmioty (inventory)
        this.items = [];
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        
        // Invincibility frames
        this.invincibleUntil = 0;
        this.invincibleDuration = 500;
    }

    update(keys, canvas, currentTime) {
        // Regeneracja HP
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
    
    // Oblicz pozycję broni - rozłożone równomiernie wokół gracza
    getWeaponPosition(weaponIndex, currentTime, target = null) {
        const weaponRadius = 25;
        const weaponCount = this.weapons.length;
        
        // Pozycja broni - rozłożone równomiernie wokół gracza
        const spreadAngle = (Math.PI * 2 / weaponCount) * weaponIndex;
        
        // Pozycja broni względem gracza (orbit wokół gracza)
        const posX = this.x + Math.cos(spreadAngle) * weaponRadius;
        const posY = this.y + Math.sin(spreadAngle) * weaponRadius;
        
        // Kąt celowania - zawsze na wroga (niezależnie od pozycji broni)
        let aimAngle = spreadAngle; // domyślnie w kierunku pozycji
        if (target) {
            aimAngle = Math.atan2(target.y - posY, target.x - posX);
        }
        
        return {
            x: posX,
            y: posY,
            angle: aimAngle  // kąt celowania, nie pozycji!
        };
    }
    
    // Zapisz ostatni cel do renderowania
    setTarget(target) {
        this.currentTarget = target;
    }

    fireAllWeapons(mainTarget, currentTime, findEnemyFromFn) {
        if (!mainTarget && this.enemies?.length === 0) return [];
        
        // Zapisz główny cel do renderowania
        this.currentTarget = mainTarget;
        
        const allBullets = [];
        const weaponCount = this.weapons.length;
        
        for (let i = 0; i < weaponCount; i++) {
            const weapon = this.weapons[i];
            
            // Oblicz pozycję broni
            const weaponPos = this.getWeaponPosition(i, currentTime, mainTarget);
            
            // Znajdź najbliższego wroga od pozycji tej broni (z limitem zasięgu)
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
        const reduction = this.armor / (this.armor + 100); // Diminishing returns
        const finalDamage = amount * (1 - reduction);
        
        this.hp = Math.max(0, this.hp - finalDamage); // Nie pozwól na ujemne HP
        this.invincibleUntil = currentTime + this.invincibleDuration;
        
        return this.hp <= 0;
    }
    
    // Zwróć obrażenia thorns
    getThorns() {
        return this.thorns;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    addWeapon(type) {
        // Sprawdź limit broni
        if (this.weapons.length >= this.maxWeapons) {
            return false; // Brak miejsca na nową broń
        }
        
        const weapon = new Weapon(type);
        this.weapons.push(weapon);
        
        // Recalculate fire offsets for staggered shooting
        this.recalculateFireOffsets();
        
        return true;
    }
    
    // Rozłóż strzały równomiernie dla broni tego samego typu
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
        // Zapisz cel jeśli przekazany
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
        
        // Renderuj bronie wokół gracza
        this.renderWeapons(ctx, currentTime);
        
        ctx.globalAlpha = 1;
    }
    
    // Renderowanie broni wokół gracza
    renderWeapons(ctx, currentTime) {
        // Delegated to WeaponRenderer (js/systems/weapon-renderer.js)
        WeaponRenderer.renderWeapons(ctx, this, currentTime);
    }
    
    // Dodaj przedmiot
    addItem(itemId) {
        this.items.push(itemId);
    }
    
    // Policz ile masz danego przedmiotu
    countItem(itemId) {
        return this.items.filter(i => i === itemId).length;
    }

    // For collision
    get radius() {
        return this.width / 2;
    }
}
