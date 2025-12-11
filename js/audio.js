// Audio system - programatyczne generowanie dźwięków

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
        
        // Inicjalizuj po interakcji użytkownika
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
    
    // Generyczny dźwięk
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
    
    // Szum (dla eksplozji)
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
    
    // === DŹWIĘKI GRY ===
    
    // Strzał pistoletem
    shoot() {
        this.playTone(800, 0.05, 'square', 0.3);
    }
    
    // Strzał shotgunem
    shootShotgun() {
        this.playNoise(0.1, 0.4);
        this.playTone(200, 0.08, 'sawtooth', 0.3);
    }
    
    // Strzał sniperem
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
    
    // Eksplozja (bazooka, miny, granat)
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
    
    // Miotacz ognia
    flamethrower() {
        this.playNoise(0.05, 0.2);
    }
    
    // Kosa (świst)
    scytheSwing() {
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(300, 0.1, 'sine', 0.2), 50);
    }
    
    // Miecz (cięcie)
    swordSlash() {
        this.playTone(500, 0.08, 'sawtooth', 0.4);
        this.playNoise(0.05, 0.2);
    }
    
    // Kusza
    crossbowShoot() {
        this.playTone(250, 0.1, 'triangle', 0.4);
    }
    
    // Łańcuch kuszy
    chainEffect() {
        this.playTone(1500, 0.1, 'sine', 0.2);
    }
    
    // === ZBIERANIE ===
    
    // Zbieranie złota
    collectGold() {
        this.playTone(800, 0.05, 'sine', 0.3);
        this.playTone(1000, 0.05, 'sine', 0.3);
    }
    
    // Zbieranie XP
    collectXP() {
        this.playTone(600, 0.08, 'triangle', 0.2);
    }
    
    // Zbieranie zdrowia
    collectHealth() {
        this.playTone(400, 0.1, 'sine', 0.3);
        this.playTone(600, 0.1, 'sine', 0.3);
        this.playTone(800, 0.15, 'sine', 0.3);
    }
    
    // === OBRAŻENIA ===
    
    // Gracz otrzymuje obrażenia
    playerHit() {
        this.playTone(200, 0.1, 'sawtooth', 0.4);
        this.playTone(150, 0.15, 'square', 0.3);
    }
    
    // Wróg otrzymuje obrażenia
    enemyHit() {
        this.playTone(300, 0.05, 'square', 0.2);
    }
    
    // Śmierć wroga
    enemyDeath() {
        this.playTone(200, 0.1, 'sawtooth', 0.3);
        this.playTone(100, 0.15, 'sawtooth', 0.2);
    }
    
    // === UI ===
    
    // Kupno w sklepie
    purchase() {
        this.playTone(500, 0.05, 'sine', 0.3);
        this.playTone(700, 0.05, 'sine', 0.3);
        this.playTone(900, 0.1, 'sine', 0.4);
    }
    
    // Brak złota
    error() {
        this.playTone(200, 0.1, 'square', 0.3);
        this.playTone(150, 0.15, 'square', 0.3);
    }
    
    // Nowa fala
    waveStart() {
        this.playTone(400, 0.1, 'triangle', 0.3);
        this.playTone(500, 0.1, 'triangle', 0.3);
        this.playTone(600, 0.15, 'triangle', 0.4);
    }
    
    // Boss pojawia się!
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
    
    // Unik!
    dodge() {
        this.playTone(1000, 0.05, 'sine', 0.2);
        this.playTone(1200, 0.05, 'sine', 0.15);
    }
    
    // Thorns damage
    thorns() {
        this.playTone(800, 0.03, 'square', 0.2);
    }
}

// Globalna instancja audio
const audio = new AudioSystem();
