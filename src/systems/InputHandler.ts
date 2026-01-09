/**
 * InputHandler - keyboard and UI button bindings.
 * Centralizes all input event listeners.
 * Uses EventBus for state-related actions, callbacks for utility actions.
 */

import { EventBus } from '@/core/EventBus';
import { StateManager } from '@/managers/StateManager';
import { CharacterType, GameState } from '@/types/enums';

export type KeyState = Record<string, boolean>;

/**
 * Non-state callbacks for utility actions
 */
export interface InputHandlerCallbacks {
  onToggleSound: () => void;
  onSubmitScore: () => void;
  onSwitchLeaderboardTab: (tab: string) => void;
  onOpenMenuLeaderboard: () => void;
  onCloseMenuLeaderboard: () => void;
  onSwitchMenuLeaderboardTab: (tab: string) => void;
}

/**
 * Input Handler system
 */
export class InputHandler {
  private keys: KeyState = {};
  private callbacks: InputHandlerCallbacks;
  private stateManager: StateManager;

  public constructor(callbacks: InputHandlerCallbacks, stateManager: StateManager) {
    this.callbacks = callbacks;
    this.stateManager = stateManager;
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
        const state = this.stateManager.getCurrentState();
        if (state === GameState.PLAYING) {
          EventBus.emit('pauseRequested', undefined);
        } else if (state === GameState.PAUSED) {
          EventBus.emit('resumeRequested', undefined);
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
        const character = element.dataset.character as CharacterType | undefined;
        if (character) {
          EventBus.emit('characterSelected', { characterType: character });
        }
      };
    });
  }

  /**
   * Setup UI buttons
   */
  private setupButtons(): void {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn)
      restartBtn.onclick = () => {
        EventBus.emit('restartRequested', undefined);
      };

    const startWaveBtn = document.getElementById('start-wave-btn');
    if (startWaveBtn)
      startWaveBtn.onclick = () => {
        EventBus.emit('startGameRequested', undefined);
      };

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn)
      resumeBtn.onclick = () => {
        EventBus.emit('resumeRequested', undefined);
      };

    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn)
      quitBtn.onclick = () => {
        EventBus.emit('quitToMenuRequested', undefined);
      };

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle)
      soundToggle.onclick = () => {
        this.callbacks.onToggleSound();
      };
  }

  /**
   * Setup leaderboard interactions
   */
  private setupLeaderboard(): void {
    // Score submission
    const submitBtn = document.getElementById('submit-score-btn');
    if (submitBtn)
      submitBtn.onclick = () => {
        this.callbacks.onSubmitScore();
      };

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
      menuLeaderboardBtn.onclick = () => {
        this.callbacks.onOpenMenuLeaderboard();
      };
    }

    const menuLeaderboardClose = document.getElementById('menu-leaderboard-close');
    if (menuLeaderboardClose) {
      menuLeaderboardClose.onclick = () => {
        this.callbacks.onCloseMenuLeaderboard();
      };
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
