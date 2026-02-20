/**
 * ProjectileSystem - Manages projectile lifecycle.
 * Handles movement, expiration (grenade explosions), and off-screen cleanup.
 */

import { ConfigService } from '@/config/ConfigService';
import { EntityManager } from '@/managers/EntityManager';
import { ProjectileType } from '@/types/enums';
import { type CanvasBounds, type Vector2 } from '@/utils';
import { singleton } from 'tsyringe';
import { CombatSystem } from './CombatSystem';

@singleton()
export class ProjectileSystem {
  private readonly canvasBounds: CanvasBounds;

  /** Off-screen margin before destroying projectiles */
  private static readonly OFF_SCREEN_MARGIN = 50;

  public constructor(
    private entityManager: EntityManager,
    private combatSystem: CombatSystem,
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
          const isBanana =
            projectile.type === ProjectileType.BANANA ||
            projectile.type === ProjectileType.MINI_BANANA;
          const isMini = projectile.type === ProjectileType.MINI_BANANA;
          this.combatSystem.queueExplosion({
            position: projectile.position,
            radius: expRadius,
            damage: projectile.explosive.explosionDamage,
            visualEffect: projectile.explosive.visualEffect,
            sourceId: projectile.id,
            isBanana,
            isMini,
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
