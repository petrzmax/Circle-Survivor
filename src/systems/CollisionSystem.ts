/**
 * CollisionSystem - Handles collision detection between entities.
 * Emits events when collisions are detected for other systems to handle.
 */

import { EntityManager } from '@/managers/EntityManager';
import { distanceSquared } from '@/utils';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Pickup } from '@/entities/Pickup';
import { Deployable } from '@/entities/Deployable';

/**
 * Collision detection result
 */
export interface CollisionResult {
  /** Player hit by enemy */
  playerEnemyCollisions: Enemy[];
  /** Player hit by enemy projectile */
  playerProjectileCollisions: Projectile[];
  /** Player projectiles hitting enemies */
  projectileEnemyCollisions: Array<{ projectile: Projectile; enemy: Enemy }>;
  /** Pickups in player collection range */
  pickupCollisions: Pickup[];
  /** Enemies triggering deployables */
  deployableCollisions: Array<{ deployable: Deployable; enemies: Enemy[] }>;
}

/**
 * CollisionSystem configuration
 */
export interface CollisionSystemConfig {
  /** Player pickup collection radius */
  pickupRadius?: number;
  /** Player pickup attraction radius */
  attractionRadius?: number;
}

/**
 * Handles all collision detection in the game.
 * Uses spatial queries from EntityManager for efficiency.
 * 
 * @example
 * ```typescript
 * const collisionSystem = new CollisionSystem(entityManager, {
 *   pickupRadius: 25,
 *   attractionRadius: 100
 * });
 * 
 * // In game loop
 * const collisions = collisionSystem.checkAll();
 * // Handle collisions or let other systems handle via events
 * ```
 */
export class CollisionSystem {
  private entityManager: EntityManager;
  private pickupRadius: number;
  private attractionRadius: number;

  constructor(entityManager: EntityManager, config: CollisionSystemConfig = {}) {
    this.entityManager = entityManager;
    this.pickupRadius = config.pickupRadius ?? 25;
    this.attractionRadius = config.attractionRadius ?? 100;
  }

  /**
   * Check all collisions and return results
   */
  checkAll(): CollisionResult {
    const result: CollisionResult = {
      playerEnemyCollisions: [],
      playerProjectileCollisions: [],
      projectileEnemyCollisions: [],
      pickupCollisions: [],
      deployableCollisions: [],
    };

    const player = this.entityManager.getPlayer();
    if (!player || !player.isActive) {
      return result;
    }

    // Check player-enemy collisions
    result.playerEnemyCollisions = this.checkPlayerEnemyCollisions();

    // Check player-projectile collisions (enemy bullets)
    result.playerProjectileCollisions = this.checkPlayerProjectileCollisions();

    // Check projectile-enemy collisions (player bullets)
    result.projectileEnemyCollisions = this.checkProjectileEnemyCollisions();

    // Check pickup collisions
    result.pickupCollisions = this.checkPickupCollisions();

    // Check deployable collisions
    result.deployableCollisions = this.checkDeployableCollisions();

    return result;
  }

  /**
   * Check player collision with enemies
   */
  private checkPlayerEnemyCollisions(): Enemy[] {
    const player = this.entityManager.getPlayer();
    if (!player) return [];

    const collisions: Enemy[] = [];
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      // Skip phasing enemies
      if (enemy.phasing) continue;

      const combinedRadius = player.radius + enemy.radius;
      if (distanceSquared(player, enemy) < combinedRadius * combinedRadius) {
        collisions.push(enemy);
      }
    }

    return collisions;
  }

  /**
   * Check player collision with enemy projectiles
   */
  private checkPlayerProjectileCollisions(): Projectile[] {
    const player = this.entityManager.getPlayer();
    if (!player) return [];

    const collisions: Projectile[] = [];
    const enemyProjectiles = this.entityManager.getEnemyProjectiles();

    for (const projectile of enemyProjectiles) {
      const combinedRadius = player.radius + projectile.radius;
      if (distanceSquared(player, projectile) < combinedRadius * combinedRadius) {
        collisions.push(projectile);
      }
    }

    return collisions;
  }

  /**
   * Check player projectiles hitting enemies
   */
  private checkProjectileEnemyCollisions(): Array<{ projectile: Projectile; enemy: Enemy }> {
    const collisions: Array<{ projectile: Projectile; enemy: Enemy }> = [];
    const playerProjectiles = this.entityManager.getPlayerProjectiles();
    const enemies = this.entityManager.getActiveEnemies();

    for (const projectile of playerProjectiles) {
      for (const enemy of enemies) {
        const combinedRadius = projectile.radius + enemy.radius;
        if (distanceSquared(projectile, enemy) < combinedRadius * combinedRadius) {
          // For piercing projectiles, check if already hit
          if (projectile.canPierce()) {
            if (!projectile.registerHit(enemy.id)) {
              continue; // Already hit this enemy
            }
          }

          collisions.push({ projectile, enemy });

          // Non-piercing projectiles stop after first hit
          if (!projectile.canPierce()) {
            break;
          }
        }
      }
    }

    return collisions;
  }

  /**
   * Check pickup collection (immediate pickup on contact)
   */
  private checkPickupCollisions(): Pickup[] {
    const player = this.entityManager.getPlayer();
    if (!player) return [];

    const collisions: Pickup[] = [];
    const pickups = this.entityManager.getActivePickups();

    for (const pickup of pickups) {
      const combinedRadius = this.pickupRadius + pickup.radius;
      if (distanceSquared(player, pickup) < combinedRadius * combinedRadius) {
        collisions.push(pickup);
      }
    }

    return collisions;
  }

  /**
   * Check deployable triggers (enemies stepping on mines)
   */
  private checkDeployableCollisions(): Array<{ deployable: Deployable; enemies: Enemy[] }> {
    const collisions: Array<{ deployable: Deployable; enemies: Enemy[] }> = [];
    const deployables = this.entityManager.getArmedDeployables();
    const enemies = this.entityManager.getActiveEnemies();

    for (const deployable of deployables) {
      const triggerRadius = deployable.triggerRadius ?? deployable.radius;
      const triggeredBy: Enemy[] = [];

      for (const enemy of enemies) {
        const combinedRadius = triggerRadius + enemy.radius;
        if (distanceSquared(deployable, enemy) < combinedRadius * combinedRadius) {
          triggeredBy.push(enemy);
        }
      }

      if (triggeredBy.length > 0) {
        collisions.push({ deployable, enemies: triggeredBy });
      }
    }

    return collisions;
  }

  /**
   * Update pickup attraction (moves pickups toward player)
   */
  updatePickupAttraction(deltaTime: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

    const pickups = this.entityManager.getActivePickups();
    const playerPos = player.getPosition();

    for (const pickup of pickups) {
      pickup.updateAttraction(playerPos, this.attractionRadius, deltaTime);
    }
  }

  /**
   * Find enemies in explosion radius
   */
  getEnemiesInExplosion(x: number, y: number, radius: number): Enemy[] {
    return this.entityManager.getEnemiesInRadius(x, y, radius);
  }

  /**
   * Find nearest enemy for chain effects
   */
  findChainTarget(
    x: number,
    y: number,
    range: number,
    excludeIds: Set<number>
  ): Enemy | null {
    const enemies = this.entityManager.getActiveEnemies()
      .filter(e => !excludeIds.has(e.id));

    let nearest: Enemy | null = null;
    let nearestDistSq = range * range;

    for (const enemy of enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Check if point is inside any enemy
   */
  isPointInEnemy(x: number, y: number): Enemy | null {
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      const dx = x - enemy.x;
      const dy = y - enemy.y;
      if (dx * dx + dy * dy <= enemy.radius * enemy.radius) {
        return enemy;
      }
    }

    return null;
  }

  /**
   * Set pickup collection radius
   */
  setPickupRadius(radius: number): void {
    this.pickupRadius = radius;
  }

  /**
   * Set pickup attraction radius
   */
  setAttractionRadius(radius: number): void {
    this.attractionRadius = radius;
  }
}
