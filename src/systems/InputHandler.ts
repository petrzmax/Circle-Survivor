/**
 * InputHandler - keyboard and UI button bindings.
 * Centralizes all input event listeners.
 * Matches original js/systems/input-handler.js exactly.
 */

export type KeyState = Record<string, boolean>;

export interface InputHandlerCallbacks {
  onPause: () => void;
  onResume: () => void;
  onSelectCharacter: (characterType: string) => void;
  onRestart: () => void;
  onStartWave: () => void;
  onQuitToMenu: () => void;
  onToggleSound: () => void;
  onSubmitScore: () => void;
  onSwitchLeaderboardTab: (tab: string) => void;
  onOpenMenuLeaderboard: () => void;
  onCloseMenuLeaderboard: () => void;
  onSwitchMenuLeaderboardTab: (tab: string) => void;
  getState: () => string;
}

/**
 * Input Handler system
 */
export class InputHandler {
  private keys: KeyState = {};
  private callbacks: InputHandlerCallbacks;

  public constructor(callbacks: InputHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Setup all event listeners
   */
  public setup(): void {
    this.setupKeyboard();
    this.setupCharacterSelection();
    this.setupButtons();
    this.setupLeaderboard();
  }

  /**
   * Get current key state
   */
  public getKeys(): KeyState {
    return this.keys;
  }

  /**
   * Check if a key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keys[key.toLowerCase()] ?? false;
  }

  /**
   * Setup keyboard listeners
   */
  private setupKeyboard(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;

      // Pause toggle
      if (e.key === 'Escape') {
        const state = this.callbacks.getState();
        if (state === 'playing') {
          this.callbacks.onPause();
        } else if (state === 'paused') {
          this.callbacks.onResume();
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  /**
   * Setup character selection cards
   */
  private setupCharacterSelection(): void {
    document.querySelectorAll('.character-card').forEach((card) => {
      const element = card as HTMLElement;
      element.onclick = () => {
        const character = element.dataset.character;
        if (character) {
          this.callbacks.onSelectCharacter(character);
        }
      };
    });
  }

  /**
   * Setup UI buttons
   */
  private setupButtons(): void {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.onclick = () => { this.callbacks.onRestart(); };

    const startWaveBtn = document.getElementById('start-wave-btn');
    if (startWaveBtn) startWaveBtn.onclick = () => { this.callbacks.onStartWave(); };

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.onclick = () => { this.callbacks.onResume(); };

    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) quitBtn.onclick = () => { this.callbacks.onQuitToMenu(); };

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) soundToggle.onclick = () => { this.callbacks.onToggleSound(); };
  }

  /**
   * Setup leaderboard interactions
   */
  private setupLeaderboard(): void {
    // Score submission
    const submitBtn = document.getElementById('submit-score-btn');
    if (submitBtn) submitBtn.onclick = () => { this.callbacks.onSubmitScore(); };

    const playerName = document.getElementById('player-name');
    if (playerName) {
      playerName.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') this.callbacks.onSubmitScore();
      });
    }

    // Leaderboard tabs (game over screen)
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const element = btn as HTMLElement;
      element.onclick = () => {
        const tab = element.dataset.tab;
        if (tab) this.callbacks.onSwitchLeaderboardTab(tab);
      };
    });

    // Menu leaderboard
    const menuLeaderboardBtn = document.getElementById('menu-leaderboard-btn');
    if (menuLeaderboardBtn) {
      menuLeaderboardBtn.onclick = () => { this.callbacks.onOpenMenuLeaderboard(); };
    }

    const menuLeaderboardClose = document.getElementById('menu-leaderboard-close');
    if (menuLeaderboardClose) {
      menuLeaderboardClose.onclick = () => { this.callbacks.onCloseMenuLeaderboard(); };
    }

    document.querySelectorAll('.menu-tab-btn').forEach((btn) => {
      const element = btn as HTMLElement;
      element.onclick = () => {
        const tab = element.dataset.tab;
        if (tab) this.callbacks.onSwitchMenuLeaderboardTab(tab);
      };
    });
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    // Note: In a real cleanup, we'd store references to remove the listeners
    // For this game, we assume the page is reloaded between games
  }
}
