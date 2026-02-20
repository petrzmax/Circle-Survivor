import { GAME_BALANCE } from '@/config/balance.config';
import { ConfigService } from '@/config/ConfigService';
import { Projectile } from '@/entities/Projectile';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { ProjectileType } from '@/types/enums';
import { type CanvasBounds } from '@/utils';
import { singleton } from 'tsyringe';

@singleton()
export class EnemySystem {
  private readonly canvasBounds: CanvasBounds;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    this.canvasBounds = configService.getCanvasBounds();
  }

  /**
   * Update all enemies: movement toward player, boss shooting logic.
   */
  public update(deltaTime: number, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      enemy.update(deltaTime);
      enemy.moveTowardsTarget(player.position, deltaTime, this.canvasBounds);

      // Boss shooting (creates projectiles/shockwaves)
      if (enemy.canShoot) {
        const attackResult = enemy.tryAttack(player.position, currentTime);
        if (attackResult) {
          if (attackResult.type === 'bullets') {
            const enemyVel = enemy.getVelocity();

            for (const bulletData of attackResult.bullets) {
              const projectile = new Projectile({
                position: {
                  x: bulletData.x,
                  y: bulletData.y,
                },
                radius: Math.floor(enemy.radius * GAME_BALANCE.enemy.bulletRadiusRatio),
                type: ProjectileType.ENEMY_BULLET,
                damage: bulletData.damage,
                ownerId: enemy.id,
                color: bulletData.color,
                maxDistance: 1000,
              });
              // Add enemy velocity to projectile (velocity inheritance)
              projectile.setVelocity(bulletData.vx + enemyVel.vx, bulletData.vy + enemyVel.vy);
              this.entityManager.addProjectile(projectile);
            }

            const { pattern } = attackResult;
            if (enemy.isBoss) {
              EventBus.emit('enemyFired', { isBoss: true, pattern });
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (attackResult.type === 'shockwave') {
            EventBus.emit('shockwaveTriggered', attackResult);
          }
        }
      }
    }
  }
}
