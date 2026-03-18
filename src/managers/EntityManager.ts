/**
 * EntityManager - Centralized entity lifecycle management.
 * Pure Koota ECS — no adapters, all methods return Entity or Entity[].
 */

import {
  ArenaBound,
  Collider,
  IsArmed,
  IsBoss,
  IsDead,
  IsDeployable,
  IsEnemy,
  IsPickup,
  IsPlayer,
  IsPlayerOwned,
  IsProjectile,
  PhysicsBody,
  PlayerStats,
  Position,
  Velocity,
} from '@/ecs/traits';
import { world } from '@/ecs/world';
import { distanceSquared, pointInRect, Vector2 } from '@/utils';
import { createQuery, Not, type Entity, type ExtractSchema, type TraitRecord } from 'koota';
import { singleton } from 'tsyringe';

// ============ Cached Queries ============
const activeEnemiesQuery = createQuery(IsEnemy, Not(IsDead));
const activeBossesQuery = createQuery(IsEnemy, IsBoss, Not(IsDead));
const activeProjectilesQuery = createQuery(IsProjectile, Not(IsDead));
const activePlayerProjectilesQuery = createQuery(IsProjectile, IsPlayerOwned, Not(IsDead));
const activeEnemyProjectilesQuery = createQuery(IsProjectile, Not(IsPlayerOwned), Not(IsDead));
const activeDeployablesQuery = createQuery(IsDeployable, Not(IsDead));
const armedDeployablesQuery = createQuery(IsDeployable, IsArmed, Not(IsDead));
const activePickupsQuery = createQuery(IsPickup, Not(IsDead));
const knockbackableEntitiesQuery = createQuery(PhysicsBody, Position, Collider, Not(IsDead));
const physicsEntitiesQuery = createQuery(PhysicsBody, Velocity, Position, Not(IsDead));
const arenaBoundEntitiesQuery = createQuery(ArenaBound, Position, Collider, Velocity, Not(IsDead));
const deadEntitiesQuery = createQuery(IsDead);
const playerQuery = createQuery(IsPlayer);

/**
 * Manages all game entities via Koota ECS world queries.
 * Returns raw Koota Entity — type discriminated by tags (IsEnemy, IsPlayer, etc.).
 */
@singleton()
export class EntityManager {
  // ========== Player ==========

  /** Returns the player entity. Throws if no player exists. */
  public getPlayerEntity(): Entity {
    const [entity] = world.query(playerQuery);
    if (!entity) throw new Error('No player entity found!');
    return entity;
  }

  /** Returns the player's stats (live AoS reference). Throws if no player exists. */
  public getPlayerStats(): TraitRecord<ExtractSchema<typeof PlayerStats>> {
    return this.getPlayerEntity().get(PlayerStats)!;
  }

  /** Check if a player entity exists. */
  public hasPlayer(): boolean {
    return world.query(playerQuery).length > 0;
  }

  // ========== Enemies ==========

  public getActiveEnemies(): readonly Entity[] {
    return world.query(activeEnemiesQuery);
  }

  public getActiveBosses(): readonly Entity[] {
    return world.query(activeBossesQuery);
  }

  public killAllEnemies(): void {
    for (const entity of world.query(activeEnemiesQuery)) {
      if (!entity.has(IsDead)) entity.add(IsDead);
    }
  }

  public getActiveEnemyCount(): number {
    return world.query(activeEnemiesQuery).length;
  }

  // ========== Projectiles ==========

  public getActiveProjectiles(): readonly Entity[] {
    return world.query(activeProjectilesQuery);
  }

  public getActivePlayerProjectiles(): readonly Entity[] {
    return world.query(activePlayerProjectilesQuery);
  }

  public getActiveEnemyProjectiles(): readonly Entity[] {
    return world.query(activeEnemyProjectilesQuery);
  }

  // ========== Deployables ==========

  public getActiveDeployables(): readonly Entity[] {
    return world.query(activeDeployablesQuery);
  }

  public getArmedDeployables(): readonly Entity[] {
    return world.query(armedDeployablesQuery);
  }

  // ========== Pickups ==========

  public getActivePickups(): readonly Entity[] {
    return world.query(activePickupsQuery);
  }

  // ========== Physics ==========

  public getKnockbackableEntities(): readonly Entity[] {
    return world.query(knockbackableEntitiesQuery);
  }

  public getPhysicsEntities(): readonly Entity[] {
    return world.query(physicsEntitiesQuery);
  }

  public getArenaBoundEntities(): readonly Entity[] {
    return world.query(arenaBoundEntitiesQuery);
  }

  // ========== Bulk Operations ==========

  /**
   * Remove all dead entities from the world.
   */
  public removeInactive(): number {
    const deadEntities = world.query(deadEntitiesQuery);
    let removed = 0;

    for (const entity of deadEntities) {
      entity.destroy();
      removed++;
    }

    if (removed > 0) {
      this.log(`Removed ${removed} inactive entities`);
    }

    return removed;
  }

  /**
   * Clear all entities (reset game)
   */
  public clear(): void {
    for (const entity of [...world.entities]) {
      entity.destroy();
    }
    this.log('All entities cleared');
  }

  /**
   * Clear all except player
   */
  public clearExceptPlayer(): void {
    for (const entity of [...world.entities]) {
      if (!entity.has(IsPlayer)) {
        entity.destroy();
      }
    }
    this.log('All entities except player cleared');
  }

  // ========== Query Helpers ==========

  /**
   * Find enemies within radius of a point.
   * Returns entity + distance pairs for falloff calculations.
   */
  public getEnemiesInRadius(
    position: Vector2,
    radius: number,
  ): Array<{ entity: Entity; dist: number }> {
    const radiusSq = radius * radius;
    const results: Array<{ entity: Entity; dist: number }> = [];

    for (const entity of world.query(activeEnemiesQuery)) {
      const pos = entity.get(Position)!;
      const dSq = distanceSquared(pos, position);
      if (dSq <= radiusSq) {
        results.push({ entity, dist: Math.sqrt(dSq) });
      }
    }

    return results;
  }

  /**
   * Find nearest enemy to a point. Returns Entity or null.
   */
  public getNearestEnemy(
    position: Vector2,
    maxDistance?: number,
    canvasBounds?: { width: number; height: number },
  ): Entity | null {
    let nearest: Entity | null = null;
    let nearestDistSq = maxDistance ? maxDistance * maxDistance : Infinity;

    for (const entity of world.query(activeEnemiesQuery)) {
      const pos = entity.get(Position)!;

      if (canvasBounds) {
        const mapRect = {
          position: { x: 0, y: 0 },
          width: canvasBounds.width,
          height: canvasBounds.height,
        };
        if (!pointInRect(pos, mapRect)) continue;
      }

      const distSq = distanceSquared(pos, position);
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = entity;
      }
    }

    return nearest;
  }

  /**
   * Find nearest enemy position to a point (convenience for targeting).
   */
  public getNearestEnemyPosition(
    position: Vector2,
    maxDistance?: number,
    canvasBounds?: { width: number; height: number },
  ): Vector2 | null {
    const entity = this.getNearestEnemy(position, maxDistance, canvasBounds);
    if (!entity) return null;
    const pos = entity.get(Position)!;
    return { x: pos.x, y: pos.y };
  }

  // ========== Debug ==========

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  private get debug(): boolean {
    return false;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[EntityManager] ${message}`);
    }
  }
}
