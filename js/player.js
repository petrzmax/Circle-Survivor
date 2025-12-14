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
                this.projectileCount,
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
        const weaponCount = this.weapons.length;
        
        if (weaponCount === 0) return;
        
        this.weapons.forEach((weapon, index) => {
            // Użyj tej samej funkcji co przy strzelaniu - z celem!
            const pos = this.getWeaponPosition(index, currentTime, this.currentTarget);
            
            // Rysuj ikonę broni
            this.drawWeaponIcon(ctx, weapon, pos.x, pos.y, pos.angle);
        });
    }
    
    // Rysowanie ikony broni
    drawWeaponIcon(ctx, weapon, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2); // Obrót w kierunku ruchu
        
        const size = 12;
        
        switch (weapon.type) {
            case 'pistol':
                // Mały pistolet
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-3, -6, 6, 10);
                ctx.fillRect(-2, -10, 4, 4);
                break;
                
            case 'smg':
                // SMG
                ctx.fillStyle = '#ffa500';
                ctx.fillRect(-3, -8, 6, 14);
                ctx.fillRect(-2, -12, 4, 4);
                break;
                
            case 'shotgun':
                // Shotgun - szeroka lufa
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-4, -6, 8, 10);
                ctx.beginPath();
                ctx.moveTo(-6, -10);
                ctx.lineTo(6, -10);
                ctx.lineTo(4, -6);
                ctx.lineTo(-4, -6);
                ctx.fill();
                break;
                
            case 'sniper':
                // Sniper - długa lufa
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(-2, -14, 4, 20);
                ctx.fillRect(-4, 2, 8, 6);
                break;
                
            case 'laser':
                // Laser - futurystyczny
                ctx.fillStyle = '#ff00ff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -3, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'minigun':
                // Minigun - wiele luf
                ctx.fillStyle = '#ff6600';
                for (let i = -2; i <= 2; i++) {
                    ctx.fillRect(i * 2 - 1, -10, 2, 14);
                }
                ctx.fillRect(-5, 2, 10, 6);
                break;
                
            case 'bazooka':
                // Bazooka - duża rura
                ctx.fillStyle = '#888';
                ctx.fillRect(-5, -12, 10, 18);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(-4, -14, 8, 4);
                break;
                
            case 'flamethrower':
                // Miotacz ognia
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(-4, -8, 8, 14);
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.moveTo(-4, -12);
                ctx.lineTo(4, -12);
                ctx.lineTo(0, -18);
                ctx.fill();
                break;
                
            case 'mines':
                // Miny
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'nuke':
                // Nuke
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(6, 8);
                ctx.lineTo(-6, 8);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'scythe':
                // Kosa
                ctx.fillStyle = '#9932cc';
                ctx.strokeStyle = '#9932cc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.lineTo(0, -8);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(5, -8, 8, Math.PI * 0.7, Math.PI * 1.5);
                ctx.stroke();
                break;
                
            case 'sword':
                // Miecz
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(-2, -14, 4, 20);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-5, 4, 10, 4);
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(-2, 8, 4, 6);
                break;
                
            case 'holyGrenade':
                // Święty granat
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(0, 4);
                ctx.moveTo(-3, 0);
                ctx.lineTo(3, 0);
                ctx.stroke();
                break;
                
            case 'banana':
                // Banan
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI, false);
                ctx.fill();
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(-1, -2, 2, 4);
                break;
                
            case 'crossbow':
                // Kusza
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(-1, -10, 2, 16);
                ctx.fillRect(-8, -4, 16, 3);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-1, -12, 2, 4);
                break;
                
            default:
                // Domyślna ikona
                ctx.fillStyle = weapon.color || '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
        }
        
        // Poziom broni (jeśli > 1)
        if (weapon.level > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`+${weapon.level - 1}`, 0, 14);
        }
        
        ctx.restore();
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
