/**
 * InputHandler - keyboard bindings.
 * Centralizes keyboard input event listeners.
 * UI button handling is done by Preact components via EventBus.
 */

import { EventBus } from '@/core/EventBus';
import { StateManager } from '@/managers/StateManager';
import { GameState } from '@/types/enums';

export type KeyState = Record<string, boolean>;

/**
 * Input Handler system
 */
export class InputHandler {
  private keys: KeyState = {};
  private stateManager: StateManager;

  public constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Setup all event listeners
   */
  public setup(): void {
    this.setupKeyboard();
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
   * Cleanup event listeners
   */
  public destroy(): void {
    // Note: In a real cleanup, we'd store references to remove the listeners
    // For this game, we assume the page is reloaded between games
  }
}
