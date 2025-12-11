// Main game controller

// Definicje postaci
const CHARACTER_TYPES = {
    wypaleniec: {
        name: 'Wypaleniec',
        description: 'Były pracownik korpo. Wypalony, ale wściekły.',
        color: '#ff6600',
        maxHp: 80,
        speed: 3.6,          // -10%
        damageMultiplier: 1.25, // +25%
        goldMultiplier: 1,
        startingWeapon: 'shotgun'
    },
    cwaniak: {
        name: 'Cwaniak',
        description: 'Zawsze znajdzie lukę w systemie.',
        color: '#00ff88',
        maxHp: 70,
        speed: 4.8,          // +20%
        damageMultiplier: 1,
        goldMultiplier: 1.3, // +30%
        startingWeapon: 'smg'
    },
    normik: {
        name: 'Normik',
        description: 'Przeciętny Kowalski. Zbalansowany we wszystkim.',
        color: '#4a9eff',
        maxHp: 100,
        speed: 4,
        damageMultiplier: 1,
        goldMultiplier: 1,
        startingWeapon: 'pistol'
    }
};

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
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Pause toggle
            if (e.key === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Character selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.onclick = () => this.selectCharacter(card.dataset.character);
        });
        
        // Buttons
        document.getElementById('restart-btn').onclick = () => this.showCharacterSelect();
        document.getElementById('start-wave-btn').onclick = () => this.startNextWave();
        document.getElementById('resume-btn').onclick = () => this.resumeGame();
        document.getElementById('quit-btn').onclick = () => this.quitToMenu();
        document.getElementById('sound-toggle').onclick = () => this.toggleSound();
        
        // Leaderboard
        document.getElementById('submit-score-btn').onclick = () => this.submitScore();
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitScore();
        });
        
        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => this.switchLeaderboardTab(btn.dataset.tab);
        });
        
        // Menu leaderboard
        document.getElementById('menu-leaderboard-btn').onclick = () => this.openMenuLeaderboard();
        document.getElementById('menu-leaderboard-close').onclick = () => this.closeMenuLeaderboard();
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.onclick = () => this.switchMenuLeaderboardTab(btn.dataset.tab);
        });
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
        const scores = await leaderboard.getScores(tab);
        const listEl = document.getElementById('menu-leaderboard-list');
        listEl.innerHTML = leaderboard.renderLeaderboard(scores);
        
        // Update tab buttons
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
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
        const scores = await leaderboard.getScores(tab);
        const listEl = document.getElementById('leaderboard-list');
        listEl.innerHTML = leaderboard.renderLeaderboard(scores, highlightName);
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
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
        // Czyść miny (pociski z isMine)
        this.bullets = this.bullets.filter(b => !b.isMine);
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
        
        // Update wave manager
        const waveResult = this.waveManager.update(deltaTime, this.canvas);
        this.enemies.push(...waveResult.enemies);
        
        if (waveResult.waveEnded) {
            this.openShop();
            return;
        }
        
        // Find nearest enemy for auto-aim (główny cel dla renderowania)
        const nearestEnemy = this.findNearestEnemy();
        
        // Fire weapons - każda broń celuje niezależnie
        const newBullets = this.player.fireAllWeapons(nearestEnemy, currentTime, (x, y) => this.findNearestEnemyFrom(x, y));
        this.bullets.push(...newBullets);
        
        // Update enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            enemy.update(this.player);
            
            // Check collision with player
            if (circleCollision(enemy, this.player)) {
                // Dodge chance
                if (this.player.dodge > 0 && Math.random() < this.player.dodge) {
                    // Dodged! Show visual effect
                    audio.dodge();
                    continue;
                }
                
                const isDead = this.player.takeDamage(enemy.damage, currentTime);
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
                const enemyBullet = enemy.tryShoot(this.player, currentTime);
                if (enemyBullet) {
                    this.enemyBullets.push(enemyBullet);
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
            
            // Remove short range bullets that expired
            if (bullet.shouldExpire && bullet.shouldExpire()) {
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
                        this.handleExplosion(bullet.x, bullet.y, expRadius, bullet.damage, bullet.isNuke, bullet.isHolyGrenade, bullet.isBanana, currentTime);
                        this.bullets.splice(i, 1);
                        bulletHit = true;
                        break;
                    }
                    
                    const isDead = enemy.takeDamage(bullet.damage, bullet.x, bullet.y, this.player.knockback);
                    
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
        
        this.updateHUD();
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
        
        // Gold - zawsze wypada
        this.pickups.push(new Pickup(
            enemy.x + randomRange(-10, 10),
            enemy.y + randomRange(-10, 10),
            'gold',
            enemy.goldValue
        ));
        
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
        
        // Exploder - deals damage to player if close
        if (enemy.explodeOnDeath) {
            const distToPlayer = distance(enemy, this.player);
            if (distToPlayer < enemy.explosionRadius) {
                this.player.takeDamage(enemy.explosionDamage, currentTime);
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
    handleExplosion(x, y, radius, damage, isNuke = false, isHolyGrenade = false, isBanana = false, currentTime) {
        // Dźwięk eksplozji
        if (isNuke) {
            audio.nukeExplosion();
        } else {
            audio.explosion();
        }
        
        // Wizualny efekt
        this.createExplosion(x, y, radius, isNuke, isHolyGrenade, isBanana);
        
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
    
    createExplosion(x, y, radius, isNuke = false, isHolyGrenade = false, isBanana = false) {
        // Store explosion for rendering
        if (!this.explosions) this.explosions = [];
        this.explosions.push({
            x, y, radius,
            maxRadius: radius,
            alpha: 1,
            created: Date.now(),
            isNuke: isNuke,
            isHolyGrenade: isHolyGrenade,
            isBanana: isBanana
        });
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
    
    // Znajdź najbliższego wroga od danej pozycji (dla broni)
    findNearestEnemyFrom(x, y) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of this.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
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
        
        // Render explosions
        if (this.explosions) {
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const exp = this.explosions[i];
                const age = Date.now() - exp.created;
                const duration = exp.isNuke ? 600 : 300;
                exp.alpha = 1 - (age / duration);
                
                if (exp.alpha <= 0) {
                    this.explosions.splice(i, 1);
                    continue;
                }
                
                this.ctx.save();
                this.ctx.globalAlpha = exp.alpha;
                this.ctx.beginPath();
                this.ctx.arc(exp.x, exp.y, exp.radius * (1 - exp.alpha * 0.3), 0, Math.PI * 2);
                
                if (exp.isNuke) {
                    // Nuke - zielona eksplozja z wieloma pierścieniami
                    const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.3, '#00ff00');
                    gradient.addColorStop(0.6, '#008800');
                    gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    // Drugi pierścień
                    this.ctx.beginPath();
                    this.ctx.arc(exp.x, exp.y, exp.radius * 0.6 * (1 - exp.alpha * 0.5), 0, Math.PI * 2);
                    this.ctx.strokeStyle = '#00ff00';
                    this.ctx.lineWidth = 5;
                    this.ctx.stroke();
                } else if (exp.isHolyGrenade) {
                    // Holy Grenade - złota święta eksplozja
                    const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.3, '#ffdd00');
                    gradient.addColorStop(0.6, '#ffaa00');
                    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    // Świetlisty krzyż
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(exp.x, exp.y - exp.radius * 0.5);
                    this.ctx.lineTo(exp.x, exp.y + exp.radius * 0.5);
                    this.ctx.moveTo(exp.x - exp.radius * 0.4, exp.y);
                    this.ctx.lineTo(exp.x + exp.radius * 0.4, exp.y);
                    this.ctx.stroke();
                } else if (exp.isBanana) {
                    // Banana bomb - żółta eksplozja
                    const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                    gradient.addColorStop(0, '#ffff00');
                    gradient.addColorStop(0.4, '#ffcc00');
                    gradient.addColorStop(0.7, '#ff6600');
                    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                } else {
                    // Zwykła eksplozja
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#ff8800';
                    this.ctx.lineWidth = 3;
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }
        }
        
        // Render chain effects
        if (this.chainEffects) {
            for (let i = this.chainEffects.length - 1; i >= 0; i--) {
                const chain = this.chainEffects[i];
                const age = Date.now() - chain.created;
                const duration = 300;
                chain.alpha = 1 - (age / duration);
                
                if (chain.alpha <= 0) {
                    this.chainEffects.splice(i, 1);
                    continue;
                }
                
                this.ctx.save();
                this.ctx.globalAlpha = chain.alpha;
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(chain.x1, chain.y1);
                this.ctx.lineTo(chain.x2, chain.y2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
        
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
        
        // Render enemy count
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Wrogów: ${this.enemies.length}`, 10, this.canvas.height - 10);
    }

    updateHUD() {
        // HP
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
        
        // Wave info
        document.getElementById('wave-num').textContent = this.waveManager.waveNumber;
        document.getElementById('wave-timer').textContent = Math.ceil(this.waveManager.timeRemaining);
        
        // Resources
        document.getElementById('gold-amount').textContent = this.gold;
        document.getElementById('xp-amount').textContent = this.xp;
        
        // Stats panel
        // Armor używa formuły: reduction = armor / (armor + 100)
        const armorReduction = this.player.armor / (this.player.armor + 100);
        document.getElementById('stat-armor').textContent = `${Math.round(armorReduction * 100)}%`;
        document.getElementById('stat-damage').textContent = `+${Math.round((this.player.damageMultiplier - 1) * 100)}%`;
        document.getElementById('stat-crit').textContent = `${Math.round(this.player.critChance * 100)}%`;
        document.getElementById('stat-dodge').textContent = `${Math.round(this.player.dodge * 100)}%`;
        document.getElementById('stat-regen').textContent = this.player.regen.toFixed(1);
    }

    openShop() {
        this.state = 'shop';
        this.waveManager.endWave(); // Zwiększ numer fali!
        this.enemies = []; // Clear remaining enemies
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
    new Game();
});
