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
  private readonly grenadeStopSpeed: number;

  /** Off-screen margin before destroying projectiles */
  private static readonly OFF_SCREEN_MARGIN = 50;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    this.canvasBounds = configService.getCanvasBounds();
    this.grenadeStopSpeed = configService.getCombatConfig().grenadeStopSpeed;
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
   * Per-frame projectile update: lifetime, rotation, distance tracking.
   * Position is handled by PhysicsSystem for all projectiles.
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

    // Track distance traveled
    const pos = entity.get(Position)!;
    pd.distanceTraveled = distance(pd.spawnPosition, { x: pos.x, y: pos.y });

    // Grenade explosion: speed below threshold means grenade has "landed"
    if (pd.weaponCategory === 'grenade') {
      const vel = entity.get(Velocity)!;
      const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
      if (speed < this.grenadeStopSpeed) {
        pd.shouldExplodeOnExpire = true;
      }
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
