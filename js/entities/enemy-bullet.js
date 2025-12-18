// EnemyBullet class (boss projectiles)

class EnemyBullet {
    constructor(x, y, vx, vy, damage, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.radius = 6;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    isOffScreen(canvas) {
        return this.x < -50 || this.x > canvas.width + 50 ||
               this.y < -50 || this.y > canvas.height + 50;
    }
    
    render(ctx) {
        ctx.save();
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Main bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Darker center
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        
        ctx.restore();
    }
}
