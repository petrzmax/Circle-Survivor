/**
 * Simple typed pub/sub EventBus for decoupled game systems.
 * Enables loose coupling between systems through events.
 */

import { Enemy, Pickup, Player, Projectile } from '@/entities';
import { WeaponType } from '@/types/enums';
import { Vector2 } from '@/utils';

/**
 * Event payload types for type-safe event handling
 */
export interface GameEvents {
  // Combat events
  enemyDeath: { enemy: Enemy; killer: 'player' | 'explosion'; position: Vector2 };
  enemyDamaged: { enemy: Enemy; damage: number; source: Vector2 };
  playerHit: { player: Player; damage: number; source: Enemy | Projectile };
  playerDeath: { player: Player; killedBy: Enemy | null };
  playerDodged: void;
  thornsTriggered: void;
  xpAwarded: { amount: number; source: Enemy };

  // Weapon events
  weaponFired: { weaponType: WeaponType };

  // Projectile events
  projectileHit: { projectile: Projectile; target: Enemy };
  projectileExpired: { projectile: Projectile };
  explosionTriggered: {
    position: Vector2;
    radius: number;
    damage: number;
    visualEffect: string;
    isBanana?: boolean;
  };

  // Pickup events
  goldCollected: { amount: number; position: Vector2 };
  healthCollected: { amount: number; position: Vector2 };
  pickupSpawned: { pickup: Pickup };
  pickupExpired: { pickup: Pickup };

  // Wave events
  waveStart: { waveNumber: number; enemyCount: number };
  waveEnd: { waveNumber: number; enemiesKilled: number };
  bossSpawned: { enemy: Enemy; bossName: string };
  bossDefeated: { enemy: Enemy; bossName: string };

  // Shop events
  shopOpened: { gold: number };
  shopClosed: void;
  itemPurchased: { itemId: string; cost: number };
  weaponPurchased: { weaponType: string; cost: number };
  shopError: void;

  // Game state events
  gameStart: { characterType: string };
  gamePause: void;
  gameResume: void;
  gameOver: { score: number; wave: number; time: number };

  // UI events
  scoreChanged: { score: number; delta: number };
  goldChanged: { gold: number; delta: number };
  healthChanged: { current: number; max: number };
  countdownTick: { seconds: number };
}

/**
 * Event callback type
 */
type EventCallback<T> = (data: T) => void;

/**
 * Subscription handle for unsubscribing
 */
export interface Subscription {
  unsubscribe(): void;
}

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
