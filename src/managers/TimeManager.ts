/**
 * TimeManager - Provides pause-safe game time.
 * Wraps the ECS world Time resource so systems don't need to import world directly.
 * All returned values only advance while the game is in PLAYING state.
 */

import { Time, world } from '@/ecs/world';
import { singleton } from 'tsyringe';

@singleton()
export class TimeManager {
  /** Elapsed game time in seconds (pauses when the game is paused). */
  public getElapsed(): number {
    return world.get(Time)?.elapsed ?? 0;
  }

  /** Current frame timestamp in ms from requestAnimationFrame (pauses when the game is paused). */
  public getCurrent(): number {
    return world.get(Time)?.current ?? 0;
  }

  /** Delta time for the current frame in seconds. */
  public getDelta(): number {
    return world.get(Time)?.delta ?? 0;
  }
}
