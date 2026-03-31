/**
 * PickupSystem - Updates pickup and deployable entity state.
 * Handles lifetime countdown, arming, animation, and expiry.
 */

import { DeployableData, IsArmed, IsAttracted, IsDead, Lifetime } from '@/ecs/traits';
import { EntityManager } from '@/managers/EntityManager';
import { TimeManager } from '@/managers/TimeManager';
import { singleton } from 'tsyringe';

@singleton()
export class PickupSystem {
  public constructor(
    private entityManager: EntityManager,
    private timeManager: TimeManager,
  ) {}

  /**
   * Update all pickups and deployables (lifetime, arming, animation).
   */
  public update(): void {
    const deltaTime = this.timeManager.getDelta();
    this.updateDeployables(deltaTime);
    this.updatePickups(deltaTime);
  }

  private updateDeployables(deltaTime: number): void {
    const deployables = this.entityManager.getActiveDeployables();

    for (const entity of deployables) {
      const data = entity.get(DeployableData)!;

      // Lifetime countdown (SoA — must use set())
      const lt = entity.get(Lifetime)!;
      entity.set(Lifetime, { remaining: lt.remaining - deltaTime });

      // Arming countdown
      if (!entity.has(IsArmed)) {
        data.armingTime -= deltaTime;
        if (data.armingTime <= 0) {
          entity.add(IsArmed);
        }
      }

      // Animation timer
      data.animationTime += deltaTime;

      // Expiry
      if (lt.remaining - deltaTime <= 0) {
        if (!entity.has(IsDead)) entity.add(IsDead);
      }
    }
  }

  private updatePickups(deltaTime: number): void {
    const pickups = this.entityManager.getActivePickups();

    for (const entity of pickups) {
      // Lifetime countdown (SoA — must use set())
      const lt = entity.get(Lifetime)!;
      const newRemaining = lt.remaining - deltaTime;
      entity.set(Lifetime, { remaining: newRemaining });

      const isAttracted = entity.has(IsAttracted);

      // Attracted pickups don't expire
      if (!isAttracted && newRemaining <= 0) {
        if (!entity.has(IsDead)) entity.add(IsDead);
      }
    }
  }
}
