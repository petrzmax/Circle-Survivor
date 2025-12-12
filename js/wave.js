// Wave management

class WaveManager {
    constructor() {
        this.waveNumber = 1;
        this.waveTime = 30; // seconds
        this.timeRemaining = this.waveTime;
        this.isWaveActive = false;
        this.spawnTimer = 0;
        this.spawnInterval = 800; // ms between spawns - znacznie szybciej!
        this.enemiesPerSpawn = 2;
        this.bossSpawned = false;
    }

    startWave() {
        this.isWaveActive = true;
        this.timeRemaining = this.getWaveDuration();
        this.spawnTimer = 0;
        this.bossSpawned = false;
        this.updateSpawnSettings();
    }

    endWave() {
        this.isWaveActive = false;
        this.waveNumber++;
    }

    getWaveDuration() {
        if (this.waveNumber <= 2) return 25;
        if (this.waveNumber <= 4) return 35;
        return 40;
    }

    updateSpawnSettings() {
        // Zbalansowana ilość wrogów
        const wave = this.waveNumber;
        
        // Wolniejszy spawn - co 1000-400ms
        this.spawnInterval = Math.max(400, 1000 - wave * 50);
        
        // Mniej wrogów na spawn: 1-4
        this.enemiesPerSpawn = Math.min(4, 1 + Math.floor(wave * 0.4));
        
        console.log(`Fala ${wave}: spawn co ${this.spawnInterval}ms, ${this.enemiesPerSpawn} wrogów/spawn`);
    }

    update(deltaTime, canvas) {
        if (!this.isWaveActive) return { enemies: [], waveEnded: false };

        const enemies = [];

        // Update timer
        this.timeRemaining -= deltaTime / 1000;
        
        if (this.timeRemaining <= 0) {
            return { enemies: [], waveEnded: true };
        }
        
        // Spawn boss co 5 fal
        if (this.shouldSpawnBoss()) {
            const spawn = getSpawnPoint(canvas);
            const bossType = this.getBossType();
            const boss = new Enemy(spawn.x, spawn.y, bossType);
            
            // Skaluj HP bossa z numerem fali
            const bossWave = Math.floor(this.waveNumber / 5);
            const hpMultiplier = 1 + (bossWave - 1) * 0.5; // +50% HP za każdą kolejną falę bossa
            boss.maxHp *= hpMultiplier;
            boss.hp = boss.maxHp;
            boss.damage *= (1 + (bossWave - 1) * 0.25); // +25% DMG
            
            enemies.push(boss);
            this.bossSpawned = true;
        }

        // Spawn enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            
            for (let i = 0; i < this.enemiesPerSpawn; i++) {
                const spawn = getSpawnPoint(canvas);
                const type = this.getRandomEnemyType();
                const enemy = new Enemy(spawn.x, spawn.y, type);
                
                // Skalowanie wrogów od fali 5 (wykładnicze: 1.02^n)
                if (this.waveNumber >= 5) {
                    const scalingWave = this.waveNumber - 5;
                    const multiplier = Math.pow(1.02, scalingWave);
                    enemy.hp = Math.round(enemy.hp * multiplier);
                    enemy.maxHp = enemy.hp;
                    enemy.damage = Math.round(enemy.damage * multiplier);
                }
                
                enemies.push(enemy);
            }
        }

        return { enemies, waveEnded: false };
    }

    getRandomEnemyType() {
        const wave = this.waveNumber;
        const rand = Math.random();

        // Fala 1: tylko basic
        if (wave === 1) {
            return 'basic';
        }
        
        // Fala 2: + fast
        if (wave === 2) {
            if (rand < 0.6) return 'basic';
            return 'fast';
        }
        
        // Fala 3: + swarm
        if (wave === 3) {
            if (rand < 0.4) return 'basic';
            if (rand < 0.7) return 'fast';
            return 'swarm';
        }
        
        // Fala 4: + tank
        if (wave === 4) {
            if (rand < 0.3) return 'basic';
            if (rand < 0.5) return 'fast';
            if (rand < 0.75) return 'swarm';
            return 'tank';
        }
        
        // Fala 5: + zigzag (boss wave!)
        if (wave === 5) {
            if (rand < 0.25) return 'basic';
            if (rand < 0.4) return 'fast';
            if (rand < 0.6) return 'swarm';
            if (rand < 0.8) return 'tank';
            return 'zigzag';
        }
        
        // Fala 6: + sprinter
        if (wave === 6) {
            if (rand < 0.2) return 'basic';
            if (rand < 0.35) return 'fast';
            if (rand < 0.5) return 'swarm';
            if (rand < 0.65) return 'tank';
            if (rand < 0.8) return 'zigzag';
            return 'sprinter';
        }
        
        // Fala 7: + exploder
        if (wave === 7) {
            if (rand < 0.15) return 'basic';
            if (rand < 0.3) return 'fast';
            if (rand < 0.45) return 'swarm';
            if (rand < 0.55) return 'tank';
            if (rand < 0.7) return 'zigzag';
            if (rand < 0.85) return 'sprinter';
            return 'exploder';
        }
        
        // Fala 8: + ghost
        if (wave === 8) {
            if (rand < 0.1) return 'basic';
            if (rand < 0.2) return 'fast';
            if (rand < 0.35) return 'swarm';
            if (rand < 0.45) return 'tank';
            if (rand < 0.6) return 'zigzag';
            if (rand < 0.75) return 'sprinter';
            if (rand < 0.87) return 'exploder';
            return 'ghost';
        }
        
        // Fala 9: + splitter
        if (wave === 9) {
            if (rand < 0.1) return 'basic';
            if (rand < 0.2) return 'fast';
            if (rand < 0.35) return 'swarm';
            if (rand < 0.45) return 'tank';
            if (rand < 0.55) return 'zigzag';
            if (rand < 0.65) return 'sprinter';
            if (rand < 0.75) return 'exploder';
            if (rand < 0.87) return 'ghost';
            return 'splitter';
        }
        
        // Fala 10+: + brute (wszystkie typy)
        if (rand < 0.08) return 'basic';
        if (rand < 0.16) return 'fast';
        if (rand < 0.3) return 'swarm';
        if (rand < 0.4) return 'tank';
        if (rand < 0.5) return 'zigzag';
        if (rand < 0.6) return 'sprinter';
        if (rand < 0.72) return 'exploder';
        if (rand < 0.82) return 'ghost';
        if (rand < 0.92) return 'splitter';
        return 'brute';
    }
    
    // Spawn bossa co 5 fal
    shouldSpawnBoss() {
        return this.waveNumber % 5 === 0 && !this.bossSpawned && this.timeRemaining < 20;
    }
    
    // Różne typy bossów w zależności od fali
    getBossType() {
        const bossWave = Math.floor(this.waveNumber / 5); // 1, 2, 3, 4...
        
        const bossTypes = [
            'boss',         // Fala 5 - podstawowy
            'bossSwarm',    // Fala 10 - rozpada się na swarmy
            'bossTank',     // Fala 15 - ogromny tank
            'bossSpeed',    // Fala 20 - szybki zigzag
            'bossExploder', // Fala 25 - eksploduje przy śmierci
            'bossGhost'     // Fala 30 - półprzezroczysty
        ];
        
        // Cyklicznie wybiera bossa, ale każdy kolejny ma +50% HP
        const bossIndex = (bossWave - 1) % bossTypes.length;
        return bossTypes[bossIndex];
    }

    render(ctx) {
        // Wave progress bar at bottom
        if (this.isWaveActive) {
            const barWidth = 200;
            const barHeight = 8;
            const x = ctx.canvas.width / 2 - barWidth / 2;
            const y = ctx.canvas.height - 30;
            const progress = this.timeRemaining / this.getWaveDuration();

            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#e94560';
            ctx.fillRect(x, y, barWidth * progress, barHeight);

            ctx.strokeStyle = '#0f3460';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);
        }
    }
}
