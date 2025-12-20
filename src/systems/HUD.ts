/**
 * HUD (Heads-Up Display) system
 * Updates and renders UI elements
 * Matches original js/systems/hud.js exactly.
 */

// ============ Types ============

export interface HUDPlayer {
  hp: number;
  maxHp: number;
  armor: number;
  damageMultiplier: number;
  critChance: number;
  dodge: number;
  regen: number;
}

export interface HUDWaveManager {
  waveNumber: number;
  timeRemaining: number;
  isWaveActive: boolean;
}

export interface HUDBoss {
  type: string;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  bossName?: string;
  hasTopHealthBar?: boolean;
}

// ============ HUD System ============

export const HUD = {
  /**
   * Update all HUD elements
   */
  update(player: HUDPlayer, waveManager: HUDWaveManager, gold: number, xp: number): void {
    this.updateHealthBar(player);
    this.updateWaveInfo(waveManager);
    this.updateResources(gold, xp);
    this.updateStatsPanel(player);
  },

  /**
   * Update health bar display
   */
  updateHealthBar(player: HUDPlayer): void {
    const hpPercent = (player.hp / player.maxHp) * 100;
    const hpFill = document.getElementById('hp-fill');
    const hpText = document.getElementById('hp-text');
    if (hpFill) hpFill.style.width = `${hpPercent}%`;
    if (hpText) hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
  },

  /**
   * Update wave information display
   */
  updateWaveInfo(waveManager: HUDWaveManager): void {
    const waveNum = document.getElementById('wave-num');
    const timerElement = document.getElementById('wave-timer');
    const timerContainer = document.getElementById('timer');

    const timeRemaining = Math.ceil(waveManager.timeRemaining);

    if (waveNum) waveNum.textContent = String(waveManager.waveNumber);
    if (timerElement) timerElement.textContent = String(timeRemaining);

    // Countdown warning - red color for last 3 seconds
    if (timerContainer) {
      if (timeRemaining <= 3 && timeRemaining > 0 && waveManager.isWaveActive) {
        timerContainer.classList.add('countdown-warning');
      } else {
        timerContainer.classList.remove('countdown-warning');
      }
    }
  },

  /**
   * Update resources display (gold, XP)
   */
  updateResources(gold: number, xp: number): void {
    const goldAmount = document.getElementById('gold-amount');
    const xpAmount = document.getElementById('xp-amount');
    if (goldAmount) goldAmount.textContent = String(gold);
    if (xpAmount) xpAmount.textContent = String(xp);
  },

  /**
   * Update stats panel display
   */
  updateStatsPanel(player: HUDPlayer): void {
    // Armor uses formula: reduction = armor / (armor + 100)
    const armorReduction = player.armor / (player.armor + 100);

    const statArmor = document.getElementById('stat-armor');
    const statDamage = document.getElementById('stat-damage');
    const statCrit = document.getElementById('stat-crit');
    const statDodge = document.getElementById('stat-dodge');
    const statRegen = document.getElementById('stat-regen');

    if (statArmor) statArmor.textContent = `${Math.round(armorReduction * 100)}%`;
    if (statDamage) statDamage.textContent = `+${Math.round((player.damageMultiplier - 1) * 100)}%`;
    if (statCrit) statCrit.textContent = `${Math.round(player.critChance * 100)}%`;
    if (statDodge) statDodge.textContent = `${Math.round(player.dodge * 100)}%`;
    if (statRegen) statRegen.textContent = player.regen.toFixed(1);
  },

  /**
   * Render boss health bar at top of screen
   */
  renderBossHealthBar(ctx: CanvasRenderingContext2D, canvasWidth: number, enemies: HUDBoss[]): void {
    // Find active boss
    const boss = enemies.find((e) => e.isBoss);
    if (!boss) return;

    // Mark boss so we don't draw small health bar above them
    boss.hasTopHealthBar = true;

    const barWidth = canvasWidth * 0.5;
    const barHeight = 18;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = 95; // Below wave/time info
    const cornerRadius = 9;

    // Boss emoji based on type
    const bossEmoji =
      boss.type === 'boss'
        ? '👹'
        : boss.type === 'bossSwarm'
          ? '🐝'
          : boss.type === 'bossTank'
            ? '🛡️'
            : boss.type === 'bossSpeed'
              ? '⚡'
              : boss.type === 'bossExploder'
                ? '💥'
                : boss.type === 'bossGhost'
                  ? '👻'
                  : '👹';

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
   */
  renderEnemyCount(ctx: CanvasRenderingContext2D, enemyCount: number, canvasHeight: number): void {
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Wrogów: ${enemyCount}`, 10, canvasHeight - 10);
  },
};
