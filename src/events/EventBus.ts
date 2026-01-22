/**
 * Simple typed pub/sub EventBus for decoupled game systems.
 * Enables loose coupling between systems through events.
 */

import { GameEvents } from './GameEvents';
import { EventCallback, Subscription } from './type';

/**
 * EventBus singleton for global event management.
 * Uses typed events for compile-time safety.
 *
 * @example
 * ```typescript
 * // Subscribe to event
 * const sub = EventBus.on('enemyDeath', (data) => {
 *   console.log(`Enemy killed at ${data.position.x}, ${data.position.y}`);
 * });
 *
 * // Emit event
 * EventBus.emit('enemyDeath', { enemy, killer: 'player', position: { x: 100, y: 200 } });
 *
 * // Cleanup
 * sub.unsubscribe();
 * ```
 */
class EventBusImpl {
  private listeners = new Map<keyof GameEvents, Set<EventCallback<unknown>>>();

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   * @returns Subscription handle for unsubscribing
   */
  public on<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>,
  ): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event);
    if (!listeners) {
      throw new Error(`Failed to get listeners for event: ${event}`);
    }

    listeners.add(callback as EventCallback<unknown>);

    return {
      unsubscribe: () => {
        listeners.delete(callback as EventCallback<unknown>);
      },
    };
  }

  /**
   * Emit an event to all subscribers
   * @param event Event name
   * @param data Event payload
   */
  public emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    // Regular listeners
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }
}

/**
 * Global EventBus instance
 */
export const EventBus = new EventBusImpl();
