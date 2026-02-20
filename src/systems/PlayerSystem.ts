/**
 * PlayerSystem - Manages player-specific updates.
 * Handles input-driven movement, health regeneration, and auto-aim targeting.
 */

import { ConfigService } from '@/config/ConfigService';
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
    const player = this.entityManager.getPlayer();

    // Poll gamepad state and get unified input
    this.inputSystem.poll();
    const input = this.inputSystem.getInputState();

    // Apply input to player movement
    player.updateMovement(input, this.canvasBounds, deltaTime);

    // Health regeneration
    if (player.regen > 0) {
      if (!this.lastRegenTime) this.lastRegenTime = currentTime;
      if (currentTime - this.lastRegenTime >= 1000) {
        player.heal(player.regen);
        this.lastRegenTime = currentTime;
      }
    }

    // Find nearest enemy for auto-aim (only within map bounds)
    const nearestEnemy = this.entityManager.getNearestEnemy(
      player.position,
      undefined,
      this.canvasBounds,
    );
    player.setTarget(nearestEnemy ? nearestEnemy.position : null);
  }

  /**
   * Reset regen timer (e.g., when starting a new game).
   */
  public reset(): void {
    this.lastRegenTime = 0;
  }
}
