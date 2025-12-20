/**
 * Leaderboard UI - handles leaderboard display and score submission
 * Matches original js/systems/leaderboard-ui.js exactly.
 */

import { Leaderboard } from './Leaderboard';

// ============ LeaderboardUI Class ============

export class LeaderboardUI {
  private leaderboard: Leaderboard;
  public currentLeaderboardTab: string = 'local';
  public currentMenuLeaderboardTab: string = 'local';
  private highlightedName: string | null = null;

  constructor(leaderboard: Leaderboard) {
    this.leaderboard = leaderboard;
  }

  /**
   * Open leaderboard from menu
   */
  async openMenuLeaderboard(): Promise<void> {
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('menu-leaderboard')?.classList.remove('hidden');
    await this.showMenuLeaderboard('local');
  }

  /**
   * Close menu leaderboard
   */
  closeMenuLeaderboard(): void {
    document.getElementById('menu-leaderboard')?.classList.add('hidden');
    document.getElementById('start-screen')?.classList.remove('hidden');
  }

  /**
   * Show menu leaderboard with specific tab
   */
  async showMenuLeaderboard(tab: string = 'local'): Promise<void> {
    const listEl = document.getElementById('menu-leaderboard-list');
    if (!listEl) return;

    // Show loading for global scores
    if (tab === 'global') {
      listEl.innerHTML =
        '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
    }

    // Update tab buttons
    document.querySelectorAll('.menu-tab-btn').forEach((btn) => {
      const tabBtn = btn as HTMLElement;
      tabBtn.classList.toggle('active', tabBtn.dataset.tab === tab);
    });

    const scores = await this.leaderboard.getScores(tab);
    listEl.innerHTML = this.leaderboard.renderLeaderboard(scores);

    this.currentMenuLeaderboardTab = tab;
  }

  /**
   * Switch menu leaderboard tab
   */
  switchMenuLeaderboardTab(tab: string): void {
    this.showMenuLeaderboard(tab);
  }

  /**
   * Submit score to leaderboard
   */
  async submitScore(wave: number, xp: number, character: string | null): Promise<void> {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-score-btn') as HTMLButtonElement;

    if (!nameInput || !submitBtn) return;

    const name = nameInput.value.trim();

    if (!name) {
      nameInput.focus();
      nameInput.style.borderColor = '#e94560';
      setTimeout(() => (nameInput.style.borderColor = ''), 500);
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';

    try {
      await this.leaderboard.submitScore(name, wave, xp, character || 'normik');

      // Hide submit form, show leaderboard
      const scoreSubmit = document.getElementById('score-submit');
      if (scoreSubmit) scoreSubmit.style.display = 'none';
      this.showLeaderboard('local', name);

      // Save name for next time
      localStorage.setItem('circle_survivor_player_name', name);
    } catch (e) {
      console.error('Error submitting score:', e);
      submitBtn.textContent = '❌ Error - try again';
      submitBtn.disabled = false;
    }
  }

  /**
   * Show leaderboard with specific tab
   */
  async showLeaderboard(tab: string = 'local', highlightName: string | null = null): Promise<void> {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    // Show loading for global scores
    if (tab === 'global') {
      listEl.innerHTML =
        '<li style="text-align: center; color: #888; padding: 20px;">⏳ Ładowanie...</li>';
    }

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const tabBtn = btn as HTMLElement;
      tabBtn.classList.toggle('active', tabBtn.dataset.tab === tab);
    });

    const scores = await this.leaderboard.getScores(tab);
    listEl.innerHTML = this.leaderboard.renderLeaderboard(scores, highlightName);

    this.currentLeaderboardTab = tab;
    this.highlightedName = highlightName;
  }

  /**
   * Switch leaderboard tab
   */
  switchLeaderboardTab(tab: string): void {
    this.showLeaderboard(tab, this.highlightedName);
  }
}
