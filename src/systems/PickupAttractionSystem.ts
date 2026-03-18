/**
 * PickupAttractionSystem - Handles magnet-based pickup attraction toward the player.
 * Pickups are pulled toward the player when they have the magnet item and are within range.
 */

import { ConfigService } from '@/config/ConfigService';
import { IsAttracted, PickupData, PlayerStats, Position, WeaponInventory } from '@/ecs/traits';
import { applyImpulse } from '@/ecs/utils/entity-utils';
import { EntityManager } from '@/managers/EntityManager';
import { TimeManager } from '@/managers/TimeManager';
import { distance } from '@/utils';
import { normalize, scaleVector, subtractVectors } from '@/utils/math';
import { singleton } from 'tsyringe';

@singleton()
export class PickupAttractionSystem {
  private readonly attractionForce: number;
  private readonly attractionRampUpDuration: number;
  private readonly minDistanceFactor: number;
  private readonly maxDistanceFactor: number;

  public constructor(
    private entityManager: EntityManager,
    private timeManager: TimeManager,
    configService: ConfigService,
  ) {
    const pickupConfig = configService.getPickupConfig();
    this.attractionForce = pickupConfig.attractionForce;
    this.attractionRampUpDuration = pickupConfig.attractionRampUpDuration;
    this.minDistanceFactor = pickupConfig.minDistanceFactor;
    this.maxDistanceFactor = pickupConfig.maxDistanceFactor;
  }

  /**
   * Updates attraction for all active pickups.
   * Only applies when the player has the magnet item.
   */
  public update(deltaTime: number): void {
    const playerEntity = this.entityManager.getPlayerEntity();

    const inventory = playerEntity.get(WeaponInventory);
    if (!inventory?.items.includes('magnet')) return;

    const playerPos = playerEntity.get(Position)!;
    const playerStats = playerEntity.get(PlayerStats)!;
    const pickupRange = playerStats.pickupRange;
    const now = this.timeManager.getElapsed();

    const pickups = this.entityManager.getActivePickups();

    for (const pickup of pickups) {
      const pickupPos = pickup.get(Position)!;
      const distToPlayer = distance(pickupPos, playerPos);
      const isAttracted = pickup.has(IsAttracted);

      if (distToPlayer < pickupRange || isAttracted) {
        const pickupData = pickup.get(PickupData)!;

        if (!isAttracted) {
          pickup.add(IsAttracted);
          pickupData.attractionStartTime = now;
        }

        if (distToPlayer > 0) {
          const dir = normalize(subtractVectors(playerPos, pickupPos));

          // Distance factor: stronger when closer
          const normalizedDistance = Math.min(1, distToPlayer / pickupRange);
          const distanceFactor =
            this.maxDistanceFactor -
            (this.maxDistanceFactor - this.minDistanceFactor) * normalizedDistance;

          // Time factor: ramps up continuously — no cap, so pickups accelerate until collected
          const timeSinceAttraction = now - pickupData.attractionStartTime;
          const timeFactor = timeSinceAttraction / this.attractionRampUpDuration;

          const forceMagnitude = this.attractionForce * distanceFactor * timeFactor * deltaTime;
          applyImpulse(pickup, scaleVector(dir, forceMagnitude));
        }
      }
    }
  }
}
