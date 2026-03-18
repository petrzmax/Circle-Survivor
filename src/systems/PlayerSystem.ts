/**
 * PlayerSystem - Manages player-specific updates.
 * Handles input-driven movement, health regeneration, and auto-aim targeting.
 */

import { ConfigService } from '@/config/ConfigService';
import { PlayerStats, Position } from '@/ecs/traits';
import { healEntity } from '@/ecs/utils/entity-utils';
import { updatePlayerMovement } from '@/ecs/utils/player-utils';
import { EntityManager } from '@/managers/EntityManager';
import { type CanvasBounds } from '@/utils';
import { singleton } from 'tsyringe';
import { InputSystem } from './InputSystem';

@singleton()
export class PlayerSystem {
  private readonly canvasBounds: CanvasBounds;

  /** Regeneration tracking */
  private lastRegenTime: number = 0;

  public constructor(
    private entityManager: EntityManager,
    private inputSystem: InputSystem,
    configService: ConfigService,
  ) {
    this.canvasBounds = configService.getCanvasBounds();
  }

  /**
   * Update player: poll input, move, regen, set auto-aim target.
   */
  public update(deltaTime: number, currentTime: number): void {
    const player = this.entityManager.getPlayerEntity();
    const stats = player.get(PlayerStats)!;

    // Poll gamepad state and get unified input
    this.inputSystem.poll();
    const input = this.inputSystem.getInputState();

    // Apply input to player movement (impulse-based — PhysicsSystem integrates)
    updatePlayerMovement(player, input, deltaTime);

    // Health regeneration
    if (stats.regen > 0) {
      if (!this.lastRegenTime) this.lastRegenTime = currentTime;
      if (currentTime - this.lastRegenTime >= 1000) {
        healEntity(player, stats.regen);
        this.lastRegenTime = currentTime;
      }
    }

    // Find nearest enemy for auto-aim (only within map bounds)
    const nearestEnemyPos = this.entityManager.getNearestEnemyPosition(
      player.get(Position)!,
      undefined,
      this.canvasBounds,
    );
    stats.currentTarget = nearestEnemyPos;
  }

  /**
   * Reset regen timer (e.g., when starting a new game).
   */
  public reset(): void {
    this.lastRegenTime = 0;
  }
}
