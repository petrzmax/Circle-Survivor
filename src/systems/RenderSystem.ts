import { EntityManager } from '@/managers';
import { renderDeployable, renderPickup, renderPlayer, renderProjectile } from '@/rendering';
import { renderBackground } from '@/rendering/BackgroundRenderer';
import { renderEnemy } from '@/rendering/EnemyRenderer';
import { renderWeapons } from '.';

export class RenderSystem {
  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public renderAll(ctx: CanvasRenderingContext2D, currentTime: number): void {
    renderBackground(ctx);
    // TODO render effects
    this.renderPickups(ctx);
    this.renderDeployables(ctx, currentTime);
    this.renderProjectiles(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx, currentTime);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    renderPlayer(ctx, player, currentTime);
    renderWeapons(ctx, player);
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.entityManager.getActiveEnemies()) {
      renderEnemy(ctx, enemy);
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const projectile of this.entityManager.getActiveProjectiles()) {
      renderProjectile(ctx, projectile);
    }
  }

  private renderDeployables(ctx: CanvasRenderingContext2D, currentTime: number): void {
    for (const deployable of this.entityManager.getActiveDeployables()) {
      renderDeployable(ctx, deployable, currentTime);
    }
  }

  private renderPickups(ctx: CanvasRenderingContext2D): void {
    for (const pickup of this.entityManager.getActivePickups()) {
      renderPickup(ctx, pickup);
    }
  }
}
