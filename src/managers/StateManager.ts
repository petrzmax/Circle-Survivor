/**
 * StateManager - Finite State Machine for game state management.
 * Subscribes to EventBus for state transition events.
 * Validates and enforces valid state transitions.
 */

import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { GameState } from '@/types/enums';

/**
 * Finite State Machine for game state management.
 * All state changes are triggered via EventBus events.
 */
@singleton()
export class StateManager {
  private currentState: GameState = GameState.MENU;
  private validTransitions: Map<GameState, Set<GameState>>;
  private isTransitioning: boolean = false;

  public constructor() {
    this.validTransitions = new Map();
    this.setupValidTransitions();
    this.subscribeToEvents();
  }

  /**
   * Define FSM transition rules.
   * Maps each state to the set of valid destination states.
   */
  private setupValidTransitions(): void {
    this.validTransitions.set(GameState.MENU, new Set([GameState.PLAYING]));
    this.validTransitions.set(
      GameState.PLAYING,
      new Set([GameState.SHOP, GameState.PAUSED, GameState.GAME_OVER]),
    );
    this.validTransitions.set(GameState.SHOP, new Set([GameState.PLAYING]));
    this.validTransitions.set(GameState.PAUSED, new Set([GameState.PLAYING, GameState.MENU]));
    this.validTransitions.set(GameState.GAME_OVER, new Set([GameState.MENU]));
  }

  /**
   * Subscribe to EventBus events that trigger state transitions.
   */
  private subscribeToEvents(): void {
    EventBus.on('startGameRequested', () => this.transitionTo(GameState.PLAYING));
    EventBus.on('waveCleared', () => this.transitionTo(GameState.SHOP));
    EventBus.on('pauseRequested', () => this.transitionTo(GameState.PAUSED));
    EventBus.on('resumeRequested', () => this.transitionTo(GameState.PLAYING));
    EventBus.on('quitToMenuRequested', () => this.transitionTo(GameState.MENU));
    EventBus.on('playerDeath', () => this.transitionTo(GameState.GAME_OVER));
    EventBus.on('restartRequested', () => this.transitionTo(GameState.MENU));
  }

  /**
   * Attempt to transition to a new state.
   * Validates the transition and emits state change event if valid.
   */
  private transitionTo(newState: GameState): boolean {
    // Prevent re-entrant transitions
    if (this.isTransitioning) {
      console.warn(
        `[StateManager] Transition already in progress, ignoring: ${this.currentState} → ${newState}`,
      );
      return false;
    }

    // Validate transition
    if (!this.canTransitionTo(newState)) {
      console.warn(`[StateManager] Invalid transition: ${this.currentState} → ${newState}`);
      return false;
    }

    this.isTransitioning = true;
    const oldState = this.currentState;
    this.currentState = newState;

    // Emit state change event with full context
    EventBus.emit('stateEntered', { state: newState, from: oldState });

    this.isTransitioning = false;
    return true;
  }

  /**
   * Check if a transition to the given state is valid from the current state.
   */
  public canTransitionTo(state: GameState): boolean {
    const validTargets = this.validTransitions.get(this.currentState);
    return validTargets?.has(state) ?? false;
  }

  /**
   * Get the current game state.
   */
  public getCurrentState(): GameState {
    return this.currentState;
  }
}
