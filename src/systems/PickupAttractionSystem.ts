/**
 * PickupAttractionSystem - Handles magnet-based pickup attraction toward the player.
 * Pickups are pulled toward the player when they have the magnet item and are within range.
 */

import { ConfigService } from '@/config/ConfigService';
import { IsAttracted, PlayerCharacter, PlayerStats, Position, WeaponInventory } from '@/ecs/traits';
import { EntityManager } from '@/managers/EntityManager';
import { distance } from '@/utils';
import { addVectors, normalize, scaleVector, subtractVectors } from '@/utils/math';
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
    const playerEntity = this.entityManager.getPlayerEntity();

    const inventory = playerEntity.get(WeaponInventory);
    if (!inventory?.items.includes('magnet')) return;

    const playerPos = playerEntity.get(Position)!;
    const playerStats = playerEntity.get(PlayerStats)!;
    const playerChar = playerEntity.get(PlayerCharacter)!;
    const playerSpeed = playerChar.characterConfig!.speed * playerStats.speedMultiplier;
    const pickupRange = playerStats.pickupRange;

    const pickups = this.entityManager.getActivePickups();

    for (const pickup of pickups) {
      const pickupPos = pickup.get(Position)!;
      const distToPlayer = distance(pickupPos, playerPos);
      const isAttracted = pickup.has(IsAttracted);

      if (distToPlayer < pickupRange || isAttracted) {
        if (!isAttracted) {
          pickup.add(IsAttracted);
        }

        if (distToPlayer > 0) {
          const dir = normalize(subtractVectors(playerPos, pickupPos));

          const normalizedDistance = Math.min(1, distToPlayer / pickupRange);
          const distanceFactor =
            this.maxDistanceFactor -
            (this.maxDistanceFactor - this.minDistanceFactor) * normalizedDistance;
          const magnetSpeed = playerSpeed * this.speedMultiplier * distanceFactor;

          // Position is SoA — must use set()
          pickup.set(Position, addVectors(pickupPos, scaleVector(dir, magnetSpeed * deltaTime)));
        }
      }
    }
  }
}
