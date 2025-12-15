// Audio system - programmatic sound generation

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
        
        // Initialize after user interaction
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
            this.enabled = false;
        }
    }
    
    // Generic tone
    playTone(frequency, duration, type = 'square', volumeMod = 1) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(this.volume * volumeMod, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    
    // Noise (for explosions)
    playNoise(duration, volumeMod = 1) {
        if (!this.enabled || !this.ctx) return;
        
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        gain.gain.setValueAtTime(this.volume * volumeMod, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    }
    
    // === GAME SOUNDS ===
    
    // Pistol shot
    shoot() {
        this.playTone(800, 0.05, 'square', 0.3);
    }
    
    // Shotgun shot
    shootShotgun() {
        this.playNoise(0.1, 0.4);
        this.playTone(200, 0.08, 'sawtooth', 0.3);
    }
    
    // Sniper shot
    shootSniper() {
        this.playTone(150, 0.15, 'sawtooth', 0.5);
        this.playTone(100, 0.2, 'sine', 0.3);
    }
    
    // Laser
    shootLaser() {
        this.playTone(1200, 0.03, 'sine', 0.2);
    }
    
    // Minigun
    shootMinigun() {
        this.playTone(600, 0.02, 'square', 0.15);
    }
    
    // Explosion (bazooka, mines, grenade)
    explosion() {
        this.playNoise(0.3, 0.6);
        this.playTone(80, 0.3, 'sine', 0.5);
    }
    
    // Nuke!
    nukeExplosion() {
        this.playNoise(0.8, 1);
        this.playTone(40, 0.5, 'sine', 0.8);
        setTimeout(() => this.playTone(60, 0.4, 'sine', 0.5), 100);
        setTimeout(() => this.playTone(50, 0.3, 'sine', 0.3), 200);
    }
    
    // Flamethrower
    flamethrower() {
        this.playNoise(0.05, 0.2);
    }
    
    // Scythe (whoosh)
    scytheSwing() {
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(300, 0.1, 'sine', 0.2), 50);
    }
    
    // Sword (slash)
    swordSlash() {
        this.playTone(500, 0.08, 'sawtooth', 0.4);
        this.playNoise(0.05, 0.2);
    }
    
    // Crossbow
    crossbowShoot() {
        this.playTone(250, 0.1, 'triangle', 0.4);
    }
    
    // Crossbow chain
    chainEffect() {
        this.playTone(1500, 0.1, 'sine', 0.2);
    }
    
    // === COLLECTION ===
    
    // Collecting gold
    collectGold() {
        this.playTone(800, 0.05, 'sine', 0.3);
        this.playTone(1000, 0.05, 'sine', 0.3);
    }
    
    // Collecting XP
    collectXP() {
        this.playTone(600, 0.08, 'triangle', 0.2);
    }
    
    // Collecting health
    collectHealth() {
        this.playTone(400, 0.1, 'sine', 0.3);
        this.playTone(600, 0.1, 'sine', 0.3);
        this.playTone(800, 0.15, 'sine', 0.3);
    }
    
    // === DAMAGE ===
    
    // Player takes damage
    playerHit() {
        this.playTone(200, 0.1, 'sawtooth', 0.4);
        this.playTone(150, 0.15, 'square', 0.3);
    }
    
    // Enemy takes damage
    enemyHit() {
        this.playTone(300, 0.05, 'square', 0.2);
    }
    
    // Enemy death
    enemyDeath() {
        this.playTone(200, 0.1, 'sawtooth', 0.3);
        this.playTone(100, 0.15, 'sawtooth', 0.2);
    }
    
    // === UI ===
    
    // Shop purchase
    purchase() {
        this.playTone(500, 0.05, 'sine', 0.3);
        this.playTone(700, 0.05, 'sine', 0.3);
        this.playTone(900, 0.1, 'sine', 0.4);
    }
    
    // Not enough gold
    error() {
        this.playTone(200, 0.1, 'square', 0.3);
        this.playTone(150, 0.15, 'square', 0.3);
    }
    
    // New wave
    waveStart() {
        this.playTone(400, 0.1, 'triangle', 0.3);
        this.playTone(500, 0.1, 'triangle', 0.3);
        this.playTone(600, 0.15, 'triangle', 0.4);
    }
    
    // Boss spawns!
    bossSpawn() {
        this.playTone(100, 0.3, 'sawtooth', 0.5);
        this.playTone(80, 0.4, 'sawtooth', 0.4);
        this.playTone(60, 0.5, 'sawtooth', 0.3);
    }
    
    // Game Over
    gameOver() {
        this.playTone(400, 0.2, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.4), 150);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.4), 300);
        setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.5), 450);
    }
    
    // Dodge!
    dodge() {
        this.playTone(1000, 0.05, 'sine', 0.2);
        this.playTone(1200, 0.05, 'sine', 0.15);
    }
    
    // Thorns damage
    thorns() {
        this.playTone(800, 0.03, 'square', 0.2);
    }
    
    // Countdown tick (last 3 seconds of wave)
    countdownTick(secondsLeft) {
        if (secondsLeft === 0) {
            // Final sound - happy, short "ding ding!"
            this.playTone(500, 0.08, 'triangle', 0.3);
            setTimeout(() => this.playTone(600, 0.1, 'triangle', 0.35), 100);
        } else {
            // Warning "blip" - short, electronic
            this.playTone(300, 0.08, 'square', 0.25);
            this.playTone(350, 0.06, 'sawtooth', 0.15);
        }
    }
}

// Globalna instancja audio
const audio = new AudioSystem();
