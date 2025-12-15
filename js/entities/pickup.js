// Pickup class (XP, Gold, Health)
// Requires: utils.js (distance, normalize)

class Pickup {
    constructor(x, y, type, value) {
        this.x = x;
        this.y = y;
        this.baseY = y; // Bazowa pozycja Y dla animacji
        this.type = type; // 'xp', 'gold', or 'health'
        this.value = value;
        this.radius = 8;
        this.magnetSpeed = 5;
        this.beingCollected = false;
        this.animationOffset = Math.random() * Math.PI * 2; // Losowy offset animacji
        this.spawnTime = Date.now();
        this.lifetime = this.type === 'gold' ? 3000 : 15000; // 3s dla złota, 15s dla health
        this.shrinkDuration = 1000; // Ostatnia 1 sekunda - kurczenie
    }
    
    isExpired() {
        // Health i gold znikają po czasie
        if (this.type !== 'gold' && this.type !== 'health') return false;
        if (this.beingCollected) return false; // Nie znikaj jak jest zbierane
        return Date.now() - this.spawnTime > this.lifetime;
    }
    
    // Zwraca skalę od 0 do 1 (1 = pełny rozmiar, 0 = zniknięty)
    getScale() {
        if (this.type !== 'gold' && this.type !== 'health') return 1;
        if (this.beingCollected) return 1;
        
        const age = Date.now() - this.spawnTime;
        const shrinkStart = this.lifetime - this.shrinkDuration;
        
        if (age < shrinkStart) return 1;
        
        // Płynne kurczenie w ostatniej sekundzie
        const shrinkProgress = (age - shrinkStart) / this.shrinkDuration;
        return Math.max(0, 1 - shrinkProgress);
    }

    update(player) {
        const dist = distance(this, player);
        
        // Animacja góra-dół (tylko gdy nie jest zbierane)
        if (!this.beingCollected) {
            const time = (Date.now() - this.spawnTime) / 1000;
            this.y = this.baseY + Math.sin(time * 3 + this.animationOffset) * 1.5;
        }
        
        // Magnet effect
        if (dist < player.pickupRange || this.beingCollected) {
            this.beingCollected = true;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const norm = normalize({ x: dx, y: dy });
            this.x += norm.x * this.magnetSpeed;
            this.y += norm.y * this.magnetSpeed;
            this.baseY = this.y; // Aktualizuj bazową pozycję
        }
        
        // Collect
        if (dist < player.radius) {
            return true;
        }
        return false;
    }

    render(ctx) {
        ctx.save();
        
        // Zastosuj skalę (animacja kurczenia dla złota)
        const scale = this.getScale();
        if (scale < 1) {
            ctx.globalAlpha = scale; // Też dodaj zanikanie przezroczystości
        }
        
        if (this.type === 'xp') {
            // Green diamond (XP) - już nie używane, ale zostawiam na wszelki wypadek
            ctx.fillStyle = '#2ecc71';
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius);
        } else if (this.type === 'gold') {
            // Delikatna poświata złota (tylko pod spodem)
            ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
            ctx.shadowBlur = 8 * scale;
            ctx.shadowOffsetY = 2;
            // Money bag emoji - z animacją kurczenia
            ctx.font = `${16 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💰', this.x, this.y);
        } else if (this.type === 'health') {
            // Zastosuj skalę dla health też
            const healthScale = this.getScale();
            if (healthScale < 1) {
                ctx.globalAlpha = healthScale;
            }
            
            // Red heart / cross for health - z poświatą
            ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
            ctx.shadowBlur = 10 * healthScale;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = '#ff4444';
            // Draw a heart shape
            ctx.translate(this.x, this.y);
            ctx.scale(healthScale, healthScale);
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.3);
            ctx.bezierCurveTo(-this.radius, -this.radius, -this.radius, this.radius * 0.5, 0, this.radius);
            ctx.bezierCurveTo(this.radius, this.radius * 0.5, this.radius, -this.radius, 0, -this.radius * 0.3);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
