import { EntityManager } from '@/managers';
import {
  renderDeployable,
  renderPickup,
  renderPlayer,
  renderProjectile,
  renderWeapons,
} from '@/rendering';
import { renderBackground } from '@/rendering/BackgroundRenderer';
import { renderEnemy } from '@/rendering/EnemyRenderer';
import { singleton } from 'tsyringe';
import { HUD } from './HUD';

@singleton()
export class RenderSystem {
  private entityManager: EntityManager;

  // Debug display flags
  private showEnemyCount: boolean = false;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Set whether to show enemy count on canvas (dev tool)
   */
  // TODO consider event instead, to decouple
  public setShowEnemyCount(show: boolean): void {
    this.showEnemyCount = show;
  }

  public renderAll(ctx: CanvasRenderingContext2D, currentTime: number): void {
    renderBackground(ctx);
    // TODO render effects
    this.renderPickups(ctx);
    this.renderDeployables(ctx, currentTime);
    this.renderProjectiles(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx, currentTime);

    // Debug overlays
    if (this.showEnemyCount) {
      HUD.renderEnemyCount(ctx, this.entityManager.getActiveEnemyCount(), ctx.canvas.height);
    }
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
