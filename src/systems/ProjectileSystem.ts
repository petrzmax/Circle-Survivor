/**
 * ProjectileSystem - Manages projectile lifecycle.
 * Handles movement, rotation, grenade slowdown, expiration, and off-screen cleanup.
 */

import { ConfigService } from '@/config/ConfigService';
import { IsDead, Lifetime, Position, ProjectileData, Velocity } from '@/ecs/traits';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { type CanvasBounds, type Vector2 } from '@/utils';
import { distance } from '@/utils/math';
import { getExplosionOrigin } from './damage.types';
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';

@singleton()
export class ProjectileSystem {
  private readonly canvasBounds: CanvasBounds;

  /** Off-screen margin before destroying projectiles */
  private static readonly OFF_SCREEN_MARGIN = 50;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    this.canvasBounds = configService.getCanvasBounds();
  }

  /**
   * Update all active projectiles: movement, expiration, off-screen cleanup.
   */
  public update(deltaTime: number): void {
    const playerStats = this.entityManager.getPlayerStats();
    const projectiles = this.entityManager.getActiveProjectiles();

    for (const entity of projectiles) {
      this.updateProjectile(entity, deltaTime);

      const pd = entity.get(ProjectileData)!;
      const lt = entity.get(Lifetime)!;

      // Check if expired (lifetime, max distance, or grenade reached target)
      const isExpired =
        lt.remaining <= 0 ||
        (pd.maxDistance > 0 && pd.distanceTraveled >= pd.maxDistance) ||
        pd.shouldExplodeOnExpire;

      if (isExpired) {
        // Check if grenade should explode on expire
        if (pd.shouldExplodeOnExpire && pd.explosive) {
          const pos = entity.get(Position)!;
          const expRadius = pd.explosive.explosionRadius * playerStats.explosionRadius;
          const origin = getExplosionOrigin(pd.type);
          EventBus.emit('queueExplosion', {
            position: { x: pos.x, y: pos.y },
            radius: expRadius,
            damage: pd.explosive.explosionDamage * playerStats.damageMultiplier,
            visualEffect: pd.explosive.visualEffect,
            sourceId: entity.id(),
            origin,
          });
        }
        if (!entity.has(IsDead)) entity.add(IsDead);
        continue;
      }

      // Off screen check
      const pos = entity.get(Position)!;
      if (this.isOffScreen(pos)) {
        if (!entity.has(IsDead)) entity.add(IsDead);
      }
    }
  }

  // ============ Behavior ============

  /**
   * Per-frame projectile update: lifetime, rotation, velocity, distance, grenade slowdown.
   */
  private updateProjectile(entity: Entity, deltaTime: number): void {
    const pd = entity.get(ProjectileData)!;
    const lt = entity.get(Lifetime)!;

    // Update lifetime
    entity.set(Lifetime, { remaining: lt.remaining - deltaTime });

    // Update rotation
    if (pd.rotationSpeed !== 0) {
      pd.rotation += pd.rotationSpeed * deltaTime;
    }

    // Apply velocity
    const vel = entity.get(Velocity)!;
    const pos = entity.get(Position)!;
    const newX = pos.x + vel.vx * deltaTime;
    const newY = pos.y + vel.vy * deltaTime;
    entity.set(Position, { x: newX, y: newY });

    // Calculate distance traveled (with grenade slowdown)
    if (pd.weaponCategory === 'grenade' && pd.explosiveRange > 0) {
      pd.distanceTraveled = distance(pd.spawnPosition, { x: newX, y: newY });

      const progress = pd.distanceTraveled / pd.explosiveRange;

      // Slowdown near target
      if (progress > 0.7 && progress < 1) {
        const slowdownProgress = (progress - 0.7) / 0.3;
        const speedMultiplier = Math.max(0.1, 1 - slowdownProgress * 0.9);

        const currentSpeed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
        if (currentSpeed > 0.1) {
          const targetSpeed = pd.baseSpeed * speedMultiplier;
          const scale = targetSpeed / currentSpeed;
          entity.set(Velocity, { vx: vel.vx * scale, vy: vel.vy * scale });
        }
      }

      if (progress >= 1) {
        pd.shouldExplodeOnExpire = true;
      }
    } else {
      pd.distanceTraveled = distance(pd.spawnPosition, { x: newX, y: newY });
    }
  }

  private isOffScreen({ x, y }: Vector2): boolean {
    const margin = ProjectileSystem.OFF_SCREEN_MARGIN;
    return (
      x < -margin ||
      x > this.canvasBounds.width + margin ||
      y < -margin ||
      y > this.canvasBounds.height + margin
    );
  }
}
