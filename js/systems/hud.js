// HUD (Heads-Up Display) system
// Updates and renders UI elements

const HUD = {
    /**
     * Update all HUD elements
     * @param {Player} player - Player instance
     * @param {WaveManager} waveManager - Wave manager instance
     * @param {number} gold - Current gold amount
     * @param {number} xp - Current XP amount
     */
    update(player, waveManager, gold, xp) {
        this.updateHealthBar(player);
        this.updateWaveInfo(waveManager);
        this.updateResources(gold, xp);
        this.updateStatsPanel(player);
    },
    
    /**
     * Update health bar display
     * @param {Player} player - Player instance
     */
    updateHealthBar(player) {
        const hpPercent = (player.hp / player.maxHp) * 100;
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    },
    
    /**
     * Update wave information display
     * @param {WaveManager} waveManager - Wave manager instance
     */
    updateWaveInfo(waveManager) {
        document.getElementById('wave-num').textContent = waveManager.waveNumber;
        const timerElement = document.getElementById('wave-timer');
        const timeRemaining = Math.ceil(waveManager.timeRemaining);
        timerElement.textContent = timeRemaining;
        
        // Countdown warning - red color for last 3 seconds
        const timerContainer = document.getElementById('timer');
        if (timeRemaining <= 3 && timeRemaining > 0 && waveManager.isWaveActive) {
            timerContainer.classList.add('countdown-warning');
        } else {
            timerContainer.classList.remove('countdown-warning');
        }
    },
    
    /**
     * Update resources display (gold, XP)
     * @param {number} gold - Current gold amount
     * @param {number} xp - Current XP amount
     */
    updateResources(gold, xp) {
        document.getElementById('gold-amount').textContent = gold;
        document.getElementById('xp-amount').textContent = xp;
    },
    
    /**
     * Update stats panel display
     * @param {Player} player - Player instance
     */
    updateStatsPanel(player) {
        // Armor uses formula: reduction = armor / (armor + 100)
        const armorReduction = player.armor / (player.armor + 100);
        document.getElementById('stat-armor').textContent = `${Math.round(armorReduction * 100)}%`;
        document.getElementById('stat-damage').textContent = `+${Math.round((player.damageMultiplier - 1) * 100)}%`;
        document.getElementById('stat-crit').textContent = `${Math.round(player.critChance * 100)}%`;
        document.getElementById('stat-dodge').textContent = `${Math.round(player.dodge * 100)}%`;
        document.getElementById('stat-regen').textContent = player.regen.toFixed(1);
    },
    
    /**
     * Render boss health bar at top of screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {Array} enemies - Array of enemies
     */
    renderBossHealthBar(ctx, canvasWidth, enemies) {
        // Find active boss
        const boss = enemies.find(e => e.isBoss);
        if (!boss) return;
        
        // Mark boss so we don't draw small health bar above them
        boss.hasTopHealthBar = true;
        
        const barWidth = canvasWidth * 0.5;
        const barHeight = 18;
        const barX = (canvasWidth - barWidth) / 2;
        const barY = 95; // Poniżej info o fali/czasie
        const cornerRadius = 9;
        
        // Nazwa bossa z emoji
        const bossEmoji = boss.type === 'boss' ? '👹' : 
                         boss.type === 'bossSwarm' ? '🐝' :
                         boss.type === 'bossTank' ? '🛡️' :
                         boss.type === 'bossSpeed' ? '⚡' :
                         boss.type === 'bossExploder' ? '💥' :
                         boss.type === 'bossGhost' ? '👻' : '👹';
        
        // Boss name - style matching the game
        ctx.save();
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(`${bossEmoji} ${boss.bossName || 'BOSS'}`, canvasWidth / 2 + 1, barY - 6);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`${bossEmoji} ${boss.bossName || 'BOSS'}`, canvasWidth / 2, barY - 7);
        
        // Bar background - dark with rounded corners
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, cornerRadius + 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();
        
        // Inner bar background
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        
        // HP bar fill
        const hpPercent = boss.hp / boss.maxHp;
        const fillWidth = Math.max(0, barWidth * hpPercent);
        
        if (fillWidth > 0) {
            // Gradient based on HP
            const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY + barHeight);
            if (hpPercent > 0.5) {
                gradient.addColorStop(0, '#00d26a');
                gradient.addColorStop(1, '#00b359');
            } else if (hpPercent > 0.25) {
                gradient.addColorStop(0, '#ffc107');
                gradient.addColorStop(1, '#ff9800');
            } else {
                gradient.addColorStop(0, '#ff5252');
                gradient.addColorStop(1, '#d32f2f');
            }
            
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight, cornerRadius);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Shine effect on top of the bar
            const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight / 2);
            shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillWidth, barHeight / 2, [cornerRadius, cornerRadius, 0, 0]);
            ctx.fillStyle = shineGradient;
            ctx.fill();
        }
        
        // Subtle border
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // HP text - smaller, on the right side of the bar
        const percentText = Math.ceil(hpPercent * 100) + '%';
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'right';
        ctx.fillText(percentText, barX + barWidth - 6, barY + 13);
        
        ctx.restore();
    },
    
    /**
     * Render enemy count at bottom of screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} enemyCount - Number of enemies
     * @param {number} canvasHeight - Canvas height
     */
    renderEnemyCount(ctx, enemyCount, canvasHeight) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Wrogów: ${enemyCount}`, 10, canvasHeight - 10);
    }
};
