/**
 * ProjectileSystem - Manages projectile lifecycle.
 * Handles movement, expiration (grenade explosions), and off-screen cleanup.
 */

import { ConfigService } from '@/config/ConfigService';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { ProjectileType } from '@/types/enums';
import { type CanvasBounds, type Vector2 } from '@/utils';
import { ExplosionOrigin } from './damage.types';
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
    const player = this.entityManager.getPlayer();
    const projectiles = this.entityManager.getActiveProjectiles();

    for (const projectile of projectiles) {
      projectile.update(deltaTime);

      // Remove expired - but check if grenade should explode first
      if (!projectile.isActive) {
        if (projectile.shouldExplodeOnExpire && projectile.isExplosive() && projectile.explosive) {
          const expRadius = projectile.explosive.explosionRadius * player.explosionRadius;
          // TODO - WHAT A MONSTER!! Refactor this!
          const origin =
            projectile.type === ProjectileType.MINI_BANANA
              ? ExplosionOrigin.MINI_BANANA
              : projectile.type === ProjectileType.BANANA
                ? ExplosionOrigin.BANANA
                : ExplosionOrigin.STANDARD;
          // Pre-bake damage with player multiplier at queue time
          EventBus.emit('queueExplosion', {
            position: projectile.position,
            radius: expRadius,
            damage: projectile.explosive.explosionDamage * player.damageMultiplier,
            visualEffect: projectile.explosive.visualEffect,
            sourceId: projectile.id,
            origin,
          });
        }
        this.entityManager.removeProjectile(projectile.id);
        continue;
      }

      // Off screen check - destroy projectiles that left the screen
      if (this.isOffScreen(projectile.position)) {
        projectile.destroy();
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
