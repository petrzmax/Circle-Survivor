/**
 * PickupSystem - Updates pickup and deployable entity state.
 * Handles lifetime countdown, arming, animation, and expiry.
 */

import {
  DeployableData,
  IsArmed,
  IsDead,
  IsAttracted,
  Lifetime,
  PickupData,
  Position,
} from '@/ecs/traits';
import { EntityManager } from '@/managers/EntityManager';
import { singleton } from 'tsyringe';

@singleton()
export class PickupSystem {
  public constructor(private entityManager: EntityManager) {}

  /**
   * Update all pickups and deployables (lifetime, arming, animation).
   */
  public update(deltaTime: number): void {
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
    const now = Date.now();

    for (const entity of pickups) {
      // Lifetime countdown (SoA — must use set())
      const lt = entity.get(Lifetime)!;
      const newRemaining = lt.remaining - deltaTime;
      entity.set(Lifetime, { remaining: newRemaining });

      const isAttracted = entity.has(IsAttracted);

      // Up-down animation (only when not being attracted)
      if (!isAttracted) {
        const data = entity.get(PickupData)!;
        const pos = entity.get(Position)!;
        const time = (now - data.spawnTime) / 1000;
        // Position is SoA — must use set()
        entity.set(Position, {
          x: pos.x,
          y: data.baseY + Math.sin(time * 3 + data.animationOffset) * 1.5,
        });
      }

      // Attracted pickups don't expire
      if (!isAttracted && newRemaining <= 0) {
        if (!entity.has(IsDead)) entity.add(IsDead);
      }
    }
  }
}
