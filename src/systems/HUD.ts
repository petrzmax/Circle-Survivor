/**
 * HUD (Heads-Up Display) system
 * Updates and renders UI elements
 */

import { container } from 'tsyringe';
import { CombatMath } from '@/utils/combat-math';

// ============ Types ============

export interface HUDPlayer {
  gold: number;
  xp: number;
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

// ============ HUD System ============

export const HUD = {
  /**
   * Update all HUD elements
   */
  update(player: HUDPlayer, waveManager: HUDWaveManager): void {
    this.updateHealthBar(player);
    this.updateWaveInfo(waveManager);
    this.updateResources(player);
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
  updateResources(player: HUDPlayer): void {
    const goldAmount = document.getElementById('gold-amount');
    const xpAmount = document.getElementById('xp-amount');
    if (goldAmount) goldAmount.textContent = String(player.gold);
    if (xpAmount) xpAmount.textContent = String(player.xp);
  },

  /**
   * Update stats panel display
   */
  updateStatsPanel(player: HUDPlayer): void {
    const combatMath = container.resolve(CombatMath);
    const armorReduction = combatMath.armorReduction(player.armor);

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
   * Render enemy count at bottom of screen
   */
  renderEnemyCount(ctx: CanvasRenderingContext2D, enemyCount: number, canvasHeight: number): void {
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Wrogów: ${enemyCount}`, 10, canvasHeight - 10);
  },
};
