/**
 * PickupAttractionSystem - Handles magnet-based pickup attraction toward the player.
 * Pickups are pulled toward the player when they have the magnet item and are within range.
 */

import { ConfigService } from '@/config/ConfigService';
import { EntityManager } from '@/managers/EntityManager';
import { distance } from '@/utils';
import { singleton } from 'tsyringe';

@singleton()
export class PickupAttractionSystem {
  private readonly speedMultiplier: number;
  private readonly minDistanceFactor: number;
  private readonly maxDistanceFactor: number;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    const pickupConfig = configService.getPickupConfig();
    this.speedMultiplier = pickupConfig.playerSpeedMultiplier;
    this.minDistanceFactor = pickupConfig.minDistanceFactor;
    this.maxDistanceFactor = pickupConfig.maxDistanceFactor;
  }

  /**
   * Updates attraction for all active pickups.
   * Only applies when the player has the magnet item.
   */
  public update(deltaTime: number): void {
    const player = this.entityManager.getPlayer();
    const hasMagnet = player.items.includes('magnet');
    if (!hasMagnet) return;

    const pickups = this.entityManager.getActivePickups();

    for (const pickup of pickups) {
      if (!pickup.isActive) continue;

      const distToPlayer = distance(pickup.position, player.position);

      if (distToPlayer < player.pickupRange || pickup.isAttracted) {
        pickup.isAttracted = true;

        if (distToPlayer > 0) {
          const dx = player.position.x - pickup.position.x;
          const dy = player.position.y - pickup.position.y;

          // Clamp normalized distance to [0, 1] to prevent weird behavior when outside range
          const normalizedDistance = Math.min(1, distToPlayer / player.pickupRange);
          // Interpolate from maxFactor (close) to minFactor (far)
          const distanceFactor =
            this.maxDistanceFactor -
            (this.maxDistanceFactor - this.minDistanceFactor) * normalizedDistance;
          const magnetSpeed = player.speed * this.speedMultiplier * distanceFactor;

          pickup.position.x += (dx / distToPlayer) * magnetSpeed * deltaTime;
          pickup.position.y += (dy / distToPlayer) * magnetSpeed * deltaTime;
        }
      }
    }
  }
}
