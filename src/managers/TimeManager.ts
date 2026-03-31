/**
 * TimeManager - Single source of truth for pause-safe game time.
 * Accumulates time only when ticked (i.e. during PLAYING state).
 * Writes to the ECS Time resource so all systems read consistent values.
 */

import { Time, world } from '@/ecs/world';
import { singleton } from 'tsyringe';

@singleton()
export class TimeManager {
  private static gameTimeMs: number = 0;
  private static frameDelta: number = 0;

  /**
   * Advance game time by the given frame delta (in milliseconds).
   * Call once per frame, only while the game is in PLAYING state.
   */
  public tick(deltaTimeMs: number): void {
    const deltaTime = deltaTimeMs / 1000;
    TimeManager.gameTimeMs += deltaTimeMs;
    TimeManager.frameDelta = deltaTime;

    world.set(Time, {
      delta: deltaTime,
      elapsed: TimeManager.gameTimeMs,
    });
  }

  /** Reset all time tracking (call on new game). */
  public reset(): void {
    TimeManager.gameTimeMs = 0;
    TimeManager.frameDelta = 0;
  }

  // ========== Instance accessors (for DI consumers) ==========

  public getElapsed(): number {
    return TimeManager.elapsed();
  }

  public getDelta(): number {
    return TimeManager.delta();
  }

  // ========== Static accessors (for factories and non-DI code) ==========

  /** Elapsed game time in milliseconds. */
  public static elapsed(): number {
    return TimeManager.gameTimeMs;
  }

  /** Delta time for the current frame in seconds. */
  public static delta(): number {
    return TimeManager.frameDelta;
  }
}
