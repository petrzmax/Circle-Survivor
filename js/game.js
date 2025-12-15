// Main game controller
// CHARACTER_TYPES moved to js/config/shop-items-config.js
// Collision logic -> js/systems/collision-system.js
// Effects rendering -> js/systems/effects-system.js
// HUD updates -> js/systems/hud.js

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 900;
        this.canvas.height = 700;

        // Game state
        this.state = 'start'; // start, playing, shop, gameover, paused
        this.lastTime = 0;
        this.selectedCharacter = null;
        
        // Entities
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = []; // Pociski wrogów (bossów)
        this.pickups = [];
        
        // Systems
        this.waveManager = new WaveManager();
        this.shop = new Shop();
        
        // Resources
        this.gold = 0;
        this.xp = 0;
        
        // Input
        this.keys = {};
        
        // Bind to window for shop access
        window.game = this;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Delegated to InputHandler (js/systems/input-handler.js)
        InputHandler.setup(this);
    }
    
    // Open leaderboard from menu
    async openMenuLeaderboard() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('menu-leaderboard').classList.remove('hidden');
        await this.showMenuLeaderboard('local');
    }
    
    // Close menu leaderboard
    closeMenuLeaderboard() {
        document.getElementById('menu-leaderboard').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    // Show menu leaderboard with specific tab
    async showMenuLeaderboard(tab = 'local') {
        const listEl = document.getElementById('menu-leaderboard-list');
        
        // Pokaż loading dla globalnych wyników
        if (tab === 'global') {
            listEl.innerHTML = '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
        }
        
        // Update tab buttons
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        const scores = await leaderboard.getScores(tab);
        listEl.innerHTML = leaderboard.renderLeaderboard(scores);
        
        this.currentMenuLeaderboardTab = tab;
    }
    
    // Switch menu leaderboard tab
    switchMenuLeaderboardTab(tab) {
        this.showMenuLeaderboard(tab);
    }
    
    // Submit score to leaderboard
    async submitScore() {
        const nameInput = document.getElementById('player-name');
        const submitBtn = document.getElementById('submit-score-btn');
        const name = nameInput.value.trim();
        
        if (!name) {
            nameInput.focus();
            nameInput.style.borderColor = '#e94560';
            setTimeout(() => nameInput.style.borderColor = '', 500);
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Zapisywanie...';
        
        try {
            await leaderboard.submitScore(
                name, 
                this.waveManager.waveNumber, 
                this.xp, 
                this.selectedCharacter
            );
            
            // Hide submit form, show leaderboard
            document.getElementById('score-submit').style.display = 'none';
            this.showLeaderboard('local', name);
            
            // Save name for next time
            localStorage.setItem('circle_survivor_player_name', name);
        } catch (e) {
            console.error('Error submitting score:', e);
            submitBtn.textContent = '❌ Błąd - spróbuj ponownie';
            submitBtn.disabled = false;
        }
    }
    
    // Show leaderboard with specific tab
    async showLeaderboard(tab = 'local', highlightName = null) {
        const listEl = document.getElementById('leaderboard-list');
        
        // Pokaż loading dla globalnych wyników
        if (tab === 'global') {
            listEl.innerHTML = '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
        }
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        const scores = await leaderboard.getScores(tab);
        listEl.innerHTML = leaderboard.renderLeaderboard(scores, highlightName);
        
        this.currentLeaderboardTab = tab;
        this.highlightedName = highlightName;
    }
    
    // Switch leaderboard tab
    switchLeaderboardTab(tab) {
        this.showLeaderboard(tab, this.highlightedName);
    }
    
    selectCharacter(characterType) {
        this.selectedCharacter = characterType;
        
        // Zaznacz wybraną kartę
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-character="${characterType}"]`).classList.add('selected');
        
        // Rozpocznij grę po krótkim opóźnieniu
        setTimeout(() => this.startGame(), 300);
    }
    
    showCharacterSelect() {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedCharacter = null;
        
        // Reset score submit form for next game
        const scoreSubmit = document.getElementById('score-submit');
        scoreSubmit.style.display = 'flex';
        const submitBtn = document.getElementById('submit-score-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = '📊 Zapisz wynik';
    }
    
    toggleSound() {
        audio.enabled = !audio.enabled;
        const btn = document.getElementById('sound-toggle');
        if (audio.enabled) {
            btn.textContent = '🔊 Dźwięk: WŁ';
        } else {
            btn.textContent = '🔇 Dźwięk: WYŁ';
        }
    }
    
    pauseGame() {
        this.state = 'paused';
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    resumeGame() {
        this.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    quitToMenu() {
        this.state = 'start';
        document.getElementById('pause-menu').classList.add('hidden');
        this.showCharacterSelect();
    }

    startGame() {
        if (!this.selectedCharacter) {
            this.selectedCharacter = 'normik'; // Domyślna postać
        }
        
        // Inicjalizuj audio przy pierwszej interakcji
        audio.init();
        
        // Pobierz dane postaci
        const charData = CHARACTER_TYPES[this.selectedCharacter];
        
        // Reset everything
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        
        // Zastosuj statystyki postaci
        this.player.maxHp = charData.maxHp;
        this.player.hp = charData.maxHp;
        this.player.speed = charData.speed;
        this.player.damageMultiplier = charData.damageMultiplier;
        this.player.goldMultiplier = charData.goldMultiplier;
        this.player.color = charData.color;
        this.player.weapons = [new Weapon(charData.startingWeapon)];
        
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.pickups = [];
        this.gold = 0;
        this.xp = 0;
        this.waveManager = new WaveManager();
        
        // Hide overlays
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('shop').classList.add('hidden');
        
        this.state = 'playing';
        this.waveManager.startWave();
        audio.waveStart();
        this.updateHUD();
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    startNextWave() {
        this.shop.hideShop();
        this.state = 'playing';
        // Odzyskaj pełne zdrowie na początku fali
        this.player.hp = this.player.maxHp;
        // Czyść pozostawione pickupy z poprzedniej fali
        this.pickups = [];
        // Czyść wszystkie pociski (gracza i wrogów)
        this.bullets = [];
        this.enemyBullets = [];
        this.waveManager.startWave();
        audio.waveStart();
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(deltaTime, timestamp);
        }
        
        this.render();
        
        if (this.state !== 'gameover' && this.state !== 'paused') {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(deltaTime, currentTime) {
        // Update player
        this.player.update(this.keys, this.canvas, currentTime);
        
        // Regeneration effect
        if (this.player.regen > 0) {
            if (!this.lastRegenTime) this.lastRegenTime = currentTime;
            if (currentTime - this.lastRegenTime >= 1000) {
                this.player.heal(this.player.regen);
                this.lastRegenTime = currentTime;
            }
        }
        
        // Sprawdź czy boss żyje
        const bossAlive = this.enemies.some(e => e.isBoss);
        
        // Update wave manager
        const waveResult = this.waveManager.update(deltaTime, this.canvas, bossAlive);
        this.enemies.push(...waveResult.enemies);
        
        // Countdown sound i wizualizacja
        if (waveResult.countdown !== false) {
            audio.countdownTick(waveResult.countdown);
        }
        
        if (waveResult.waveEnded) {
            this.openShop();
            return;
        }
        
        // Find nearest enemy for auto-aim (główny cel dla renderowania)
        const nearestEnemy = this.findNearestEnemy();
        
        // Fire weapons - każda broń celuje niezależnie
        const newBullets = this.player.fireAllWeapons(nearestEnemy, currentTime, (x, y, maxRange) => this.findNearestEnemyFrom(x, y, maxRange));
        this.bullets.push(...newBullets);
        
        // Update enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            enemy.update(this.player, 16, this.canvas.width, this.canvas.height);
            
            // Check collision with player
            if (circleCollision(enemy, this.player)) {
                // Dodge chance
                if (this.player.dodge > 0 && Math.random() < this.player.dodge) {
                    // Dodged! Show visual effect
                    audio.dodge();
                    continue;
                }
                
                // Boss zadaje x1.25 obrażenia przy dotknięciu
                let damage = enemy.damage;
                if (enemy.isBoss) {
                    damage *= 1.25;
                }
                
                const isDead = this.player.takeDamage(damage, currentTime);
                audio.playerHit();
                
                // Thorns damage
                if (this.player.thorns > 0) {
                    audio.thorns();
                    const thornsIsDead = enemy.takeDamage(this.player.thorns, enemy.x, enemy.y, this.player.knockback);
                    if (thornsIsDead) {
                        this.handleEnemyDeath(enemy, currentTime);
                        this.enemies.splice(j, 1);
                    }
                }
                
                if (isDead) {
                    this.gameOver();
                    return;
                }
            }
            
            // Boss shooting
            if (enemy.canShoot) {
                const attackResult = enemy.tryAttack(this.player, currentTime);
                if (attackResult) {
                    if (attackResult.type === 'bullets') {
                        // Zwykłe pociski lub spread
                        this.enemyBullets.push(...attackResult.bullets);
                    } else if (attackResult.type === 'shockwave') {
                        // Shockwave - dodaj do efektów i sprawdź kolizję z graczem
                        this.handleShockwave(attackResult, currentTime);
                    }
                }
            }
        }
        
        // Update enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.update();
            
            // Remove if off screen
            if (bullet.isOffScreen(this.canvas)) {
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (circleCollision(bullet, this.player)) {
                // Dodge chance
                if (this.player.dodge > 0 && Math.random() < this.player.dodge) {
                    audio.dodge();
                    this.enemyBullets.splice(i, 1);
                    continue;
                }
                
                const isDead = this.player.takeDamage(bullet.damage, currentTime);
                audio.playerHit();
                this.enemyBullets.splice(i, 1);
                
                if (isDead) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            
            // Remove if off screen
            if (bullet.isOffScreen(this.canvas)) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Remove short range bullets that expired OR grenades that should explode
            if (bullet.shouldExpire && bullet.shouldExpire()) {
                // Granaty wybuchają po dystansie
                if (bullet.shouldExplodeOnExpire && bullet.explosive) {
                    const expRadius = bullet.explosionRadius * this.player.explosionRadius;
                    this.handleExplosion(bullet.x, bullet.y, expRadius, bullet.damage, bullet.isNuke, bullet.isHolyGrenade, bullet.isBanana, currentTime, bullet.isMini);
                }
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies
            let bulletHit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (bullet.pierce && bullet.hitEnemies.has(enemy)) continue;
                
                // Miny tylko gdy uzbrojone
                if (bullet.isMine && !bullet.mineArmed) continue;
                
                if (circleCollision(bullet, enemy)) {
                    // Explosive bullets damage all enemies in radius
                    if (bullet.explosive) {
                        const expRadius = bullet.explosionRadius * this.player.explosionRadius;
                        this.handleExplosion(bullet.x, bullet.y, expRadius, bullet.damage, bullet.isNuke, bullet.isHolyGrenade, bullet.isBanana, currentTime, bullet.isMini);
                        this.bullets.splice(i, 1);
                        bulletHit = true;
                        break;
                    }
                    
                    const isDead = enemy.takeDamage(bullet.damage, bullet.x, bullet.y, this.player.knockback * bullet.knockbackMultiplier);
                    
                    // Chain effect (crossbow) - przekaż pozycję, nie wroga!
                    if (bullet.chain && bullet.chainCount > 0) {
                        this.handleChainEffect(enemy.x, enemy.y, bullet.damage * 0.5, bullet.chainCount, currentTime);
                    }
                    
                    // Lifesteal
                    if (this.player.lifesteal > 0) {
                        this.player.heal(bullet.damage * this.player.lifesteal);
                    }
                    
                    if (bullet.pierce) {
                        bullet.hitEnemies.add(enemy);
                        // Check pierce count
                        if (bullet.pierceCount && bullet.hitEnemies.size >= bullet.pierceCount) {
                            this.bullets.splice(i, 1);
                            bulletHit = true;
                        }
                    } else {
                        this.bullets.splice(i, 1);
                        bulletHit = true;
                    }
                    
                    if (isDead) {
                        this.handleEnemyDeath(enemy, currentTime);
                        // Sprawdź czy wróg jeszcze istnieje w tablicy (mógł być usunięty przez chain)
                        const enemyIdx = this.enemies.indexOf(enemy);
                        if (enemyIdx !== -1) {
                            this.enemies.splice(enemyIdx, 1);
                        }
                    }
                    
                    if (bulletHit) break;
                }
            }
        }
        
        // Update pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Usuń wygasłe pickupy (złoto po 7 sekundach)
            if (pickup.isExpired()) {
                this.pickups.splice(i, 1);
                continue;
            }
            
            const collected = pickup.update(this.player);
            
            if (collected) {
                if (pickup.type === 'gold') {
                    this.gold += Math.floor(pickup.value * this.player.goldMultiplier);
                    audio.collectGold();
                } else if (pickup.type === 'health') {
                    this.player.heal(pickup.value);
                    audio.collectHealth();
                }
                this.pickups.splice(i, 1);
            }
        }
        
        // Update shockwaves
        this.updateShockwaves(currentTime);
        
        this.updateHUD();
    }
    
    // Aktualizacja shockwave'ów
    updateShockwaves(currentTime) {
        // Delegated to EffectsSystem (js/systems/effects-system.js)
        const playerDied = EffectsSystem.updateShockwaves(this, currentTime);
        if (playerDied) this.gameOver();
    }
    
    handleEnemyDeath(enemy, currentTime) {
        const luck = this.player.luck;
        
        // Dźwięk śmierci
        if (enemy.isBoss) {
            audio.nukeExplosion();
        } else {
            audio.enemyDeath();
        }
        
        // XP - zbierane natychmiast
        const xpGained = Math.floor(enemy.xpValue * this.player.xpMultiplier);
        this.xp += xpGained;
        audio.collectXP();
        
        // Gold - boss dropuje więcej woreczków
        if (enemy.isBoss) {
            // Jeden duży woreczek (50% wartości) w centrum
            this.pickups.push(new Pickup(
                enemy.x,
                enemy.y,
                'gold',
                Math.floor(enemy.goldValue * 0.5)
            ));
            
            // 6-8 małych woreczków rozrzuconych dookoła
            const smallBags = 6 + Math.floor(Math.random() * 3);
            const smallValue = Math.floor((enemy.goldValue * 0.5) / smallBags);
            for (let i = 0; i < smallBags; i++) {
                const angle = (Math.PI * 2 / smallBags) * i;
                const dist = 20 + Math.random() * 30;
                this.pickups.push(new Pickup(
                    enemy.x + Math.cos(angle) * dist,
                    enemy.y + Math.sin(angle) * dist,
                    'gold',
                    smallValue
                ));
            }
        } else {
            // Zwykły wróg - jeden woreczek
            this.pickups.push(new Pickup(
                enemy.x + randomRange(-10, 10),
                enemy.y + randomRange(-10, 10),
                'gold',
                enemy.goldValue
            ));
        }
        
        // Bonus gold z luck
        if (luck > 0 && Math.random() < luck) {
            this.pickups.push(new Pickup(
                enemy.x + randomRange(-15, 15),
                enemy.y + randomRange(-15, 15),
                'gold',
                Math.floor(enemy.goldValue * 0.5)
            ));
        }
        
        // Health drop chance (15% base + luck bonus)
        if (Math.random() < (0.15 + luck * 0.2)) {
            this.pickups.push(new Pickup(
                enemy.x + randomRange(-10, 10),
                enemy.y + randomRange(-10, 10),
                'health',
                10
            ));
        }
        
        // Efekt śmierci (particle burst)
        this.createDeathEffect(enemy);
        
        // Exploder - deals damage to player if close
        if (enemy.explodeOnDeath) {
            const distToPlayer = distance(enemy, this.player);
            if (distToPlayer < enemy.explosionRadius) {
                const isDead = this.player.takeDamage(enemy.explosionDamage, currentTime);
                if (isDead) this.gameOver();
            }
            // Visual explosion effect (add to effects array if we have one)
            this.createExplosion(enemy.x, enemy.y, enemy.explosionRadius);
        }
        
        // Splitter - spawns smaller enemies
        if (enemy.splitOnDeath) {
            for (let i = 0; i < enemy.splitCount; i++) {
                const angle = (Math.PI * 2 / enemy.splitCount) * i;
                const spawnX = enemy.x + Math.cos(angle) * 30;
                const spawnY = enemy.y + Math.sin(angle) * 30;
                this.enemies.push(new Enemy(spawnX, spawnY, 'swarm'));
            }
        }
    }
    
    // Obsługa eksplozji od broni (bazooka, miny, nuke, holyGrenade, banana)
    handleExplosion(x, y, radius, damage, isNuke = false, isHolyGrenade = false, isBanana = false, currentTime, isMini = false) {
        // Dźwięk eksplozji
        if (isNuke) {
            audio.nukeExplosion();
        } else {
            audio.explosion();
        }
        
        // Wizualny efekt
        this.createExplosion(x, y, radius, isNuke, isHolyGrenade, isBanana);
        
        // Banan (nie mini) - spawn mini bananów
        if (isBanana && !isMini) {
            this.spawnMiniBananas(x, y, 4 + Math.floor(Math.random() * 3));
        }
        
        // Zadaj obrażenia wszystkim wrogom w zasięgu
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dist = distance({x, y}, enemy);
            
            if (dist < radius) {
                // Obrażenia maleją z odległością
                const damageFalloff = 1 - (dist / radius) * 0.5;
                const isDead = enemy.takeDamage(damage * damageFalloff, x, y, this.player.knockback * 1.5);
                
                // Lifesteal from explosions
                if (this.player.lifesteal > 0) {
                    this.player.heal(damage * damageFalloff * this.player.lifesteal);
                }
                
                if (isDead) {
                    this.handleEnemyDeath(enemy, currentTime);
                    this.enemies.splice(i, 1);
                }
            }
        }
    }
    
    // Spawn mini bananów po wybuchu głównego banana
    spawnMiniBananas(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
            const config = WEAPON_TYPES.minibanana;
            
            // Losowa prędkość (6-10) i dystans (60-100px) dla każdego mini banana
            const randomSpeed = 6 + Math.random() * 4;
            const randomRange = 60 + Math.random() * 40;
            
            const bullet = new Bullet(
                x, y,
                Math.cos(angle) * randomSpeed,
                Math.sin(angle) * randomSpeed,
                config.damage * this.player.damageMultiplier,
                config.color,
                false
            );
            
            bullet.radius = config.bulletRadius;
            bullet.explosive = config.explosive;
            bullet.explosionRadius = config.explosionRadius * this.player.explosionRadius;
            bullet.isBanana = config.isBanana;
            bullet.isMini = true;
            bullet.weaponCategory = config.weaponCategory;
            bullet.explosiveRange = randomRange;
            bullet.baseSpeed = randomSpeed;
            bullet.startX = x;
            bullet.startY = y;
            bullet.distanceTraveled = 0;
            
            this.bullets.push(bullet);
        }
    }
    
    // Chain effect - łączy wrogów i zadaje im obrażenia
    handleChainEffect(startX, startY, damage, chainCount, currentTime) {
        if (!this.chainEffects) this.chainEffects = [];
        
        audio.chainEffect();
        
        const chainedEnemyIds = new Set(); // Używamy Set zamiast tablicy
        let currentX = startX;
        let currentY = startY;
        const chainRange = 150;
        
        for (let i = 0; i < chainCount; i++) {
            // Znajdź najbliższego wroga, który nie jest już w łańcuchu
            let nearestDist = Infinity;
            let nearestEnemy = null;
            
            for (const enemy of this.enemies) {
                if (!enemy || chainedEnemyIds.has(enemy)) continue;
                
                const dist = distance({x: currentX, y: currentY}, enemy);
                if (dist < chainRange && dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
            
            if (!nearestEnemy) break;
            
            // Zapisz pozycję PRZED wszystkim innym
            const enemyX = nearestEnemy.x;
            const enemyY = nearestEnemy.y;
            
            // Dodaj do łańcucha
            chainedEnemyIds.add(nearestEnemy);
            
            // Dodaj efekt wizualny
            this.chainEffects.push({
                x1: currentX, y1: currentY,
                x2: enemyX, y2: enemyY,
                created: Date.now(),
                alpha: 1
            });
            
            // Aktualizuj pozycję dla następnego łańcucha
            currentX = enemyX;
            currentY = enemyY;
            
            // Zadaj obrażenia
            const isDead = nearestEnemy.takeDamage(damage, enemyX, enemyY, this.player.knockback);
            
            // Lifesteal z łańcucha
            if (this.player.lifesteal > 0) {
                this.player.heal(damage * this.player.lifesteal);
            }
            
            if (isDead) {
                this.handleEnemyDeath(nearestEnemy, currentTime);
                const idx = this.enemies.indexOf(nearestEnemy);
                if (idx !== -1) this.enemies.splice(idx, 1);
            }
        }
    }
    
    createDeathEffect(enemy) {
        // Delegated to EffectsSystem (js/systems/effects-system.js)
        EffectsSystem.createDeathEffect(this, enemy);
    }
    
    createExplosion(x, y, radius, isNuke = false, isHolyGrenade = false, isBanana = false) {
        // Delegated to EffectsSystem (js/systems/effects-system.js)
        EffectsSystem.createExplosion(this, x, y, radius, isNuke, isHolyGrenade, isBanana);
    }
    
    // Obsługa shockwave od bossa
    handleShockwave(shockwave, currentTime) {
        // Delegated to EffectsSystem (js/systems/effects-system.js)
        EffectsSystem.createShockwave(this, shockwave);
    }

    findNearestEnemy() {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of this.enemies) {
            const dist = distance(this.player, enemy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
    
    // Znajdź najbliższego wroga od danej pozycji (dla broni) z limitem zasięgu
    findNearestEnemyFrom(x, y, maxRange = Infinity) {
        let nearest = null;
        let nearestDist = Infinity;
        
        // Apply player's attackRange multiplier
        const effectiveRange = maxRange * (this.player?.attackRange || 1);
        
        for (const enemy of this.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Only consider enemies within range
            if (dist < nearestDist && dist <= effectiveRange) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid pattern
        this.ctx.strokeStyle = '#1a2744';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Render all effects (delegated to EffectsSystem)
        EffectsSystem.renderAll(this.ctx, this);
        
        // Render pickups
        for (const pickup of this.pickups) {
            pickup.render(this.ctx);
        }
        
        // Render bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }
        
        // Render enemy bullets
        for (const bullet of this.enemyBullets) {
            bullet.render(this.ctx);
        }
        
        // Render enemies
        for (const enemy of this.enemies) {
            enemy.render(this.ctx);
        }
        
        // Render player
        if (this.player) {
            const nearestEnemy = this.findNearestEnemy();
            this.player.render(this.ctx, this.lastTime, nearestEnemy);
        }
        
        // Render wave progress
        this.waveManager.render(this.ctx);
        
        // Render boss health bar at top of screen
        this.renderBossHealthBar();
        
        // Render enemy count (delegated to HUD)
        HUD.renderEnemyCount(this.ctx, this.enemies.length, this.canvas.height);
    }
    
    // Duży pasek HP bossa na górze ekranu
    renderBossHealthBar() {
        // Delegated to HUD system (js/systems/hud.js)
        HUD.renderBossHealthBar(this.ctx, this.canvas.width, this.enemies);
    }

    updateHUD() {
        // Delegated to HUD system (js/systems/hud.js)
        HUD.update(this.player, this.waveManager, this.gold, this.xp);
    }

    openShop() {
        this.state = 'shop';
        this.waveManager.endWave(); // Zwiększ numer fali!
        this.enemies = []; // Clear remaining enemies
        this.shop.resetReroll(); // Reset reroll count
        this.shop.generateItems(this.player);
        this.shop.renderShop(this.gold, this.player);
    }

    gameOver() {
        this.state = 'gameover';
        audio.gameOver();
        document.getElementById('final-wave').textContent = this.waveManager.waveNumber;
        document.getElementById('final-xp').textContent = this.xp;
        document.getElementById('game-over').classList.remove('hidden');
        
        // Load saved player name
        const savedName = localStorage.getItem('circle_survivor_player_name') || '';
        document.getElementById('player-name').value = savedName;
        
        // Show leaderboard
        this.showLeaderboard('local');
    }
}

// Start when page loads
window.addEventListener('load', () => {
    // Set version number
    if (typeof GAME_VERSION !== 'undefined') {
        document.getElementById('version-number').textContent = GAME_VERSION;
    }
    
    new Game();
});
