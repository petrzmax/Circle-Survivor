import { GAME_BALANCE } from '@/config/balance.config';
import { ConfigService } from '@/config/ConfigService';
import type { AttackPattern, AttackResult, EnemyBulletData } from '@/domain/enemies/type';
import { Collider, EnemyData, IsBoss, Knockback, Position } from '@/ecs/traits';
import { spawnProjectile } from '@/ecs/factories/entity-factories';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { ProjectileType } from '@/types/enums';
import {
  clamp,
  randomElement,
  randomInt,
  randomRange,
  type CanvasBounds,
  type Vector2,
} from '@/utils';
import { TWO_PI } from '@/utils/math';
import type { Entity } from 'koota';
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
   * Update all enemies: knockback decay, zigzag, movement, boss shooting.
   */
  public update(deltaTime: number, currentTime: number): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    const playerPos = playerEntity.get(Position)!;
    const targetPos: Vector2 = { x: playerPos.x, y: playerPos.y };
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      this.updateEnemy(enemy, deltaTime);
      this.moveEnemyTowardsTarget(enemy, targetPos, deltaTime, this.canvasBounds);

      const d = enemy.get(EnemyData)!;
      // Boss shooting (creates projectiles/shockwaves)
      if (d.canShoot) {
        const radius = enemy.get(Collider)!.radius;
        const isBoss = enemy.has(IsBoss);
        const attackResult = this.tryEnemyAttack(enemy, radius, targetPos, currentTime);
        if (attackResult) {
          if (attackResult.type === 'bullets') {
            for (const bulletData of attackResult.bullets) {
              const projEntity = spawnProjectile({
                position: { x: bulletData.x, y: bulletData.y },
                radius: Math.floor(radius * GAME_BALANCE.enemy.bulletRadiusRatio),
                type: ProjectileType.ENEMY_BULLET,
                damage: bulletData.damage,
                ownerId: enemy.id(),
                color: bulletData.color,
                maxDistance: 1000,
                vx: bulletData.vx,
                vy: bulletData.vy,
              });

              void projEntity;
            }

            const { pattern } = attackResult;
            if (isBoss) {
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

  // ============ Behaviors ============

  /**
   * Per-frame enemy update: knockback decay & zigzag timer.
   */
  private updateEnemy(entity: Entity, deltaTime: number): void {
    // Knockback decay (time-based exponential)
    const knockbackDecay = Math.pow(0.8, deltaTime * 60);
    const kb = entity.get(Knockback);
    if (kb) {
      entity.set(Knockback, {
        x: kb.x * knockbackDecay,
        y: kb.y * knockbackDecay,
      });
    }

    // Zigzag timer update
    const d = entity.get(EnemyData)!;
    if (d.zigzag) {
      d.zigzagTimer += deltaTime * 1000;
      if (d.zigzagTimer > 200) {
        d.zigzagTimer = 0;
        d.zigzagDir *= -1;
      }
    }
  }

  /**
   * Move enemy towards target with zigzag & knockback, clamped to arena bounds.
   */
  private moveEnemyTowardsTarget(
    entity: Entity,
    target: Vector2,
    deltaTime: number,
    bounds: CanvasBounds,
  ): void {
    const d = entity.get(EnemyData)!;
    const pos = entity.get(Position)!;
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let newX = pos.x;
    let newY = pos.y;

    if (dist > 0) {
      let moveX = (dx / dist) * d.speed * deltaTime;
      let moveY = (dy / dist) * d.speed * deltaTime;

      if (d.zigzag) {
        moveX += (-dy / dist) * d.speed * 0.8 * d.zigzagDir * deltaTime;
        moveY += (dx / dist) * d.speed * 0.8 * d.zigzagDir * deltaTime;
      }

      const kb = entity.get(Knockback);
      newX += moveX + (kb?.x ?? 0) * deltaTime;
      newY += moveY + (kb?.y ?? 0) * deltaTime;
    }

    const r = entity.get(Collider)!.radius;
    const isFullyInside =
      newX > r && newX < bounds.width - r && newY > r && newY < bounds.height - r;

    if (isFullyInside) {
      d.hasEnteredArena = true;
    }

    if (d.hasEnteredArena) {
      newX = clamp(newX, r, bounds.width - r);
      newY = clamp(newY, r, bounds.height - r);
    }

    entity.set(Position, { x: newX, y: newY });
  }

  /**
   * Attempt an attack from the enemy towards the target.
   */
  private tryEnemyAttack(
    entity: Entity,
    radius: number,
    target: Vector2,
    currentTime: number,
  ): AttackResult {
    const d = entity.get(EnemyData)!;
    if (!d.canShoot) return null;
    if (currentTime < d.nextFireTime) return null;

    d.nextFireTime = currentTime + this.getRandomizedFireDelay(d.fireRate);
    const pattern = randomElement(d.attackPatterns);

    const pos = entity.get(Position)!;
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    const baseAngle = Math.atan2(dy, dx);

    switch (pattern) {
      case 'spread':
        return this.createSpreadProjectiles(
          d,
          pos,
          radius,
          baseAngle,
          randomInt(4, 6),
          Math.PI / 3,
          'spread',
        );
      case 'shockwave':
        return {
          type: 'shockwave',
          x: pos.x,
          y: pos.y,
          radius: radius * 3,
          damage: d.bulletDamage * 1.5,
          color: d.color,
        };
      case 'double':
        return this.createSpreadProjectiles(d, pos, radius, baseAngle, 2, Math.PI / 9, 'double');
      case 'around':
        return this.createSpreadProjectiles(
          d,
          pos,
          radius,
          baseAngle,
          randomInt(23, 26),
          TWO_PI,
          'around',
        );
      case 'single':
      default:
        return this.createSpreadProjectiles(d, pos, radius, baseAngle, 1, 0, pattern ?? 'single');
    }
  }

  private getRandomizedFireDelay(fireRate: number): number {
    const deviation = fireRate * 0.3;
    return randomRange(fireRate - deviation, fireRate + deviation);
  }

  private createSpreadProjectiles(
    d: { bulletDamage: number; bulletSpeed: number; color: string },
    pos: { x: number; y: number },
    radius: number,
    baseAngle: number,
    spreadCount: number,
    spreadAngle: number,
    pattern: AttackPattern,
  ): AttackResult {
    const bullets: EnemyBulletData[] = [];
    const damagePerBullet = Math.max(d.bulletDamage / spreadCount, d.bulletDamage * 0.6);

    for (let i = 0; i < spreadCount; i++) {
      const angle =
        spreadCount === 1
          ? baseAngle
          : baseAngle - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
      bullets.push({
        x: pos.x + Math.cos(angle) * radius,
        y: pos.y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * d.bulletSpeed,
        vy: Math.sin(angle) * d.bulletSpeed,
        damage: damagePerBullet,
        color: d.color,
      });
    }
    return { type: 'bullets', pattern, bullets };
  }
}
