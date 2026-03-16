/**
 * CollisionSystem - Handles collision detection between entities.
 * Operates directly on Koota Entity + traits (no adapters).
 */

import type { Entity } from 'koota';
import { ConfigService } from '@/config/ConfigService';
import {
  Collider,
  DeployableData,
  EnemyData,
  IsDead,
  Position,
  ProjectileData,
} from '@/ecs/traits';
import { EntityManager } from '@/managers/EntityManager';
import { distance, distanceSquared, Vector2 } from '@/utils';
import { singleton } from 'tsyringe';
import { Shockwave } from './EffectsSystem';

/**
 * Collision detection result — all arrays contain raw Koota Entity references.
 */
export interface CollisionResult {
  /** Enemies colliding with player */
  playerEnemyCollisions: Entity[];
  /** Enemy projectiles hitting player */
  playerProjectileCollisions: Entity[];
  /** Player projectiles hitting enemies */
  projectileEnemyCollisions: Array<{ projectile: Entity; enemy: Entity }>;
  /** Pickups in player collection range */
  pickupCollisions: Entity[];
  /** Deployables triggered by enemies */
  deployableCollisions: Array<{ deployable: Entity; enemies: Entity[] }>;
  /** Shockwaves hitting the player */
  shockwavePlayerCollisions: Shockwave[];
}

@singleton()
export class CollisionSystem {
  private shockwaveProvider: (() => Shockwave[]) | null = null;

  public constructor(
    private entityManager: EntityManager,
    private configService: ConfigService,
  ) {}

  public setShockwaveProvider(provider: () => Shockwave[]): void {
    this.shockwaveProvider = provider;
  }

  public checkAll(): CollisionResult {
    const result: CollisionResult = {
      playerEnemyCollisions: [],
      playerProjectileCollisions: [],
      projectileEnemyCollisions: [],
      pickupCollisions: [],
      deployableCollisions: [],
      shockwavePlayerCollisions: [],
    };

    const playerEntity = this.entityManager.getPlayerEntity();
    if (playerEntity.has(IsDead)) return result;

    const playerPos = playerEntity.get(Position)!;
    const playerRadius = playerEntity.get(Collider)!.radius;

    result.playerEnemyCollisions = this.checkPlayerEnemyCollisions(playerPos, playerRadius);
    result.playerProjectileCollisions = this.checkPlayerProjectileCollisions(
      playerPos,
      playerRadius,
    );
    result.projectileEnemyCollisions = this.checkProjectileEnemyCollisions();
    result.pickupCollisions = this.checkPickupCollisions(playerPos, playerRadius);
    result.deployableCollisions = this.checkDeployableCollisions();
    result.shockwavePlayerCollisions = this.checkShockwavePlayerCollisions(playerPos);

    return result;
  }

  private checkPlayerEnemyCollisions(
    playerPos: { x: number; y: number },
    playerRadius: number,
  ): Entity[] {
    const collisions: Entity[] = [];
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      const d = enemy.get(EnemyData)!;
      if (d.phasing) continue;

      const ePos = enemy.get(Position)!;
      const eRadius = enemy.get(Collider)!.radius;
      const combinedRadius = playerRadius + eRadius;
      if (distanceSquared(playerPos, ePos) < combinedRadius * combinedRadius) {
        collisions.push(enemy);
      }
    }

    return collisions;
  }

  private checkPlayerProjectileCollisions(
    playerPos: { x: number; y: number },
    playerRadius: number,
  ): Entity[] {
    const collisions: Entity[] = [];
    const enemyProjectiles = this.entityManager.getActiveEnemyProjectiles();

    for (const proj of enemyProjectiles) {
      const pPos = proj.get(Position)!;
      const pRadius = proj.get(Collider)!.radius;
      const combinedRadius = playerRadius + pRadius;
      if (distanceSquared(playerPos, pPos) < combinedRadius * combinedRadius) {
        collisions.push(proj);
      }
    }

    return collisions;
  }

  private checkProjectileEnemyCollisions(): Array<{ projectile: Entity; enemy: Entity }> {
    const collisions: Array<{ projectile: Entity; enemy: Entity }> = [];
    const playerProjectiles = this.entityManager.getActivePlayerProjectiles();
    const enemies = this.entityManager.getActiveEnemies();

    for (const proj of playerProjectiles) {
      const pPos = proj.get(Position)!;
      const pRadius = proj.get(Collider)!.radius;
      const pd = proj.get(ProjectileData)!;

      for (const enemy of enemies) {
        const ePos = enemy.get(Position)!;
        const eRadius = enemy.get(Collider)!.radius;
        const combinedRadius = pRadius + eRadius;

        if (distanceSquared(pPos, ePos) < combinedRadius * combinedRadius) {
          // For piercing projectiles, check if already hit
          if (pd.pierce && pd.pierce.pierceCount > 0) {
            if (pd.pierce.hitEnemies.has(enemy.id())) {
              continue;
            }
            pd.pierce.hitEnemies.add(enemy.id());
            pd.pierce.pierceCount--;
          }

          collisions.push({ projectile: proj, enemy });

          // Non-piercing projectiles stop after first hit
          if (!pd.pierce || pd.pierce.pierceCount <= 0) {
            break;
          }
        }
      }
    }

    return collisions;
  }

  private checkPickupCollisions(
    playerPos: { x: number; y: number },
    playerRadius: number,
  ): Entity[] {
    const collisions: Entity[] = [];
    const pickups = this.entityManager.getActivePickups();

    for (const pickup of pickups) {
      const pPos = pickup.get(Position)!;
      const pRadius = pickup.get(Collider)!.radius;
      const combinedRadius = playerRadius + pRadius;
      if (distanceSquared(playerPos, pPos) < combinedRadius * combinedRadius) {
        collisions.push(pickup);
      }
    }

    return collisions;
  }

  private checkDeployableCollisions(): Array<{ deployable: Entity; enemies: Entity[] }> {
    const collisions: Array<{ deployable: Entity; enemies: Entity[] }> = [];
    const deployables = this.entityManager.getArmedDeployables();
    const enemies = this.entityManager.getActiveEnemies();

    for (const deployable of deployables) {
      const dd = deployable.get(DeployableData)!;
      const dPos = deployable.get(Position)!;
      const triggeredBy: Entity[] = [];

      for (const enemy of enemies) {
        const ePos = enemy.get(Position)!;
        const eRadius = enemy.get(Collider)!.radius;
        const combinedRadius = dd.triggerRadius + eRadius;
        if (distanceSquared(dPos, ePos) < combinedRadius * combinedRadius) {
          triggeredBy.push(enemy);
        }
      }

      if (triggeredBy.length > 0) {
        collisions.push({ deployable, enemies: triggeredBy });
      }
    }

    return collisions;
  }

  private checkShockwavePlayerCollisions(playerPos: { x: number; y: number }): Shockwave[] {
    if (!this.shockwaveProvider) return [];

    const shockwaves = this.shockwaveProvider();
    const collisions: Shockwave[] = [];
    const ringWidth = this.configService.getEffectsConfig().shockwaves.ringWidth;

    for (const sw of shockwaves) {
      if (sw.damageDealt) continue;

      const dist = distance({ x: sw.x, y: sw.y }, playerPos);
      if (dist <= sw.currentRadius && dist >= sw.currentRadius - ringWidth) {
        collisions.push(sw);
      }
    }

    return collisions;
  }

  /**
   * Check if point is inside any enemy. Returns the entity or null.
   */
  public isPointInEnemy(position: Vector2): Entity | null {
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      const ePos = enemy.get(Position)!;
      const eRadius = enemy.get(Collider)!.radius;
      const dx = position.x - ePos.x;
      const dy = position.y - ePos.y;
      if (dx * dx + dy * dy <= eRadius * eRadius) {
        return enemy;
      }
    }

    return null;
  }
}
