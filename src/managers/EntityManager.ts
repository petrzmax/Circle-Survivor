/**
 * EntityManager - Centralized entity lifecycle management.
 * Handles adding, removing, and querying game entities.
 *
 * Future: Object pooling can be added here to reduce GC pressure.
 */

import { singleton } from 'tsyringe';
import { Enemy } from '@/domain/enemies';
import { Deployable } from '@/entities/Deployable';
import { Entity } from '@/entities/Entity';
import { Pickup } from '@/entities/Pickup';
import { Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import { distanceSquared, pointInRect, Vector2 } from '@/utils';

/**
 * Entity categories for typed retrieval
 */
export type EntityCategory = 'player' | 'enemy' | 'projectile' | 'deployable' | 'pickup';

/**
 * Manages all game entities with typed collections.
 * Provides efficient add/remove/query operations.
 *
 */
@singleton()
export class EntityManager {
  /** Current player (single instance) */
  private player: Player | null = null;
  private enemies = new Map<number, Enemy>();
  private projectiles = new Map<number, Projectile>();
  private deployables = new Map<number, Deployable>();
  private pickups = new Map<number, Pickup>();
  /** Debug mode */
  // TODO - create better approach
  private debug: boolean = false;

  // ========== Player ==========

  /**
   * Set the player entity
   */
  public setPlayer(player: Player): void {
    this.player = player;
    this.log('Player set');
  }

  /**
   * Get the current player
   */
  public getPlayer(): Player {
    if (!this.player) throw new Error('No player entity found!');
    return this.player;
  }

  // ========== Enemies ==========

  public addEnemy(enemy: Enemy): void {
    this.enemies.set(enemy.id, enemy);
    this.log(`Enemy added: ${enemy.id} (type: ${enemy.type})`);
  }

  public getEnemies(): Enemy[] {
    return Array.from(this.enemies.values());
  }

  public getActiveEnemies(): Enemy[] {
    return this.getEnemies().filter((e) => e.isActive && !e.isDead());
  }

  public getEnemy(id: number): Enemy | undefined {
    return this.enemies.get(id);
  }

  public removeEnemy(id: number): boolean {
    const removed = this.enemies.delete(id);
    if (removed) this.log(`Enemy removed: ${id}`);
    return removed;
  }

  public getEnemyCount(): number {
    return this.enemies.size;
  }

  public getActiveEnemyCount(): number {
    return this.getActiveEnemies().length;
  }

  // ========== Projectiles ==========

  public addProjectile(projectile: Projectile): void {
    this.projectiles.set(projectile.id, projectile);
    this.log(`Projectile added: ${projectile.id} (type: ${projectile.type})`);
  }

  public addProjectiles(projectiles: Projectile[]): void {
    projectiles.forEach((p) => {
      this.addProjectile(p);
    });
  }

  public getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values());
  }

  public getActiveProjectiles(): Projectile[] {
    return this.getProjectiles().filter((p) => p.isActive);
  }

  public getPlayerProjectiles(): Projectile[] {
    const playerId = this.player?.id;
    if (playerId === undefined) return [];
    return this.getActiveProjectiles().filter((p) => p.ownerId === playerId);
  }

  public getEnemyProjectiles(): Projectile[] {
    const playerId = this.player?.id;
    return this.getActiveProjectiles().filter((p) => p.ownerId !== playerId);
  }

  public removeProjectile(id: number): boolean {
    const removed = this.projectiles.delete(id);
    if (removed) this.log(`Projectile removed: ${id}`);
    return removed;
  }

  // ========== Deployables ==========

  /**
   * Add a deployable
   */
  public addDeployable(deployable: Deployable): void {
    this.deployables.set(deployable.id, deployable);
    this.log(`Deployable added: ${deployable.id} (type: ${deployable.type})`);
  }

  /**
   * Get all deployables
   */
  public getDeployables(): Deployable[] {
    return Array.from(this.deployables.values());
  }

  /**
   * Get active deployables only
   */
  public getActiveDeployables(): Deployable[] {
    return this.getDeployables().filter((d) => d.isActive);
  }

  /**
   * Get armed deployables (ready to trigger)
   */
  public getArmedDeployables(): Deployable[] {
    return this.getActiveDeployables().filter((d) => d.isArmed);
  }

  /**
   * Remove a deployable
   */
  public removeDeployable(id: number): boolean {
    const removed = this.deployables.delete(id);
    if (removed) this.log(`Deployable removed: ${id}`);
    return removed;
  }

  // ========== Pickups ==========

  /**
   * Add a pickup
   */
  public addPickup(pickup: Pickup): void {
    this.pickups.set(pickup.id, pickup);
    this.log(`Pickup added: ${pickup.id} (type: ${pickup.type})`);
  }

  /**
   * Get all pickups
   */
  public getPickups(): Pickup[] {
    return Array.from(this.pickups.values());
  }

  /**
   * Get active pickups only
   */
  public getActivePickups(): Pickup[] {
    return this.getPickups().filter((p) => p.isActive);
  }

  /**
   * Remove a pickup
   */
  public removePickup(id: number): boolean {
    const removed = this.pickups.delete(id);
    if (removed) this.log(`Pickup removed: ${id}`);
    return removed;
  }

  // ========== Bulk Operations ==========

  /**
   * Update all entities
   */
  public updateAll(deltaTime: number): void {
    // Update player
    // Note: Player movement is handled separately with input

    // Update enemies
    this.enemies.forEach((enemy) => {
      if (enemy.isActive) {
        enemy.update(deltaTime);
      }
    });

    // Update projectiles
    this.projectiles.forEach((projectile) => {
      if (projectile.isActive) {
        projectile.update(deltaTime);
      }
    });

    // Update deployables
    this.deployables.forEach((deployable) => {
      if (deployable.isActive) {
        deployable.update(deltaTime);
      }
    });

    // Update pickups
    this.pickups.forEach((pickup) => {
      if (pickup.isActive) {
        pickup.update(deltaTime);
      }
    });
  }

  /**
   * Remove all inactive entities (cleanup)
   * @returns Number of entities removed
   */
  public removeInactive(): number {
    let removed = 0;

    // Cleanup enemies
    this.enemies.forEach((enemy, id) => {
      if (!enemy.isActive) {
        this.enemies.delete(id);
        removed++;
      }
    });

    // Cleanup projectiles
    this.projectiles.forEach((projectile, id) => {
      if (!projectile.isActive) {
        this.projectiles.delete(id);
        removed++;
      }
    });

    // Cleanup deployables
    this.deployables.forEach((deployable, id) => {
      if (!deployable.isActive) {
        this.deployables.delete(id);
        removed++;
      }
    });

    // Cleanup pickups
    this.pickups.forEach((pickup, id) => {
      if (!pickup.isActive) {
        this.pickups.delete(id);
        removed++;
      }
    });

    if (removed > 0) {
      this.log(`Removed ${removed} inactive entities`);
    }

    return removed;
  }

  /**
   * Get total entity count
   */
  public getTotalCount(): number {
    return (
      (this.player ? 1 : 0) +
      this.enemies.size +
      this.projectiles.size +
      this.deployables.size +
      this.pickups.size
    );
  }

  /**
   * Get entity counts by category
   */
  public getCounts(): Record<EntityCategory, number> {
    return {
      player: this.player ? 1 : 0,
      enemy: this.enemies.size,
      projectile: this.projectiles.size,
      deployable: this.deployables.size,
      pickup: this.pickups.size,
    };
  }

  /**
   * Get all entities as flat array
   */
  public getAllEntities(): Entity[] {
    const entities: Entity[] = [];

    if (this.player) {
      entities.push(this.player);
    }

    this.enemies.forEach((e) => entities.push(e));
    this.projectiles.forEach((p) => entities.push(p));
    this.deployables.forEach((d) => entities.push(d));
    this.pickups.forEach((p) => entities.push(p));

    return entities;
  }

  /**
   * Clear all entities (reset game)
   */
  public clear(): void {
    this.player = null;
    this.enemies.clear();
    this.projectiles.clear();
    this.deployables.clear();
    this.pickups.clear();
    this.log('All entities cleared');
  }

  /**
   * Clear all except player
   */
  public clearExceptPlayer(): void {
    this.enemies.clear();
    this.projectiles.clear();
    this.deployables.clear();
    this.pickups.clear();
    this.log('All entities except player cleared');
  }

  // ========== Query Helpers ==========

  /**
   * Find enemies within radius of a point
   */
  public getEnemiesInRadius(position: Vector2, radius: number): Enemy[] {
    const radiusSq = radius * radius;
    return this.getActiveEnemies().filter((enemy) => {
      return distanceSquared(enemy.position, position) <= radiusSq;
    });
  }

  /**
   * Find nearest enemy to a point
   * @param position Position to search from
   * @param maxDistance Maximum distance to search (optional)
   * @param canvasBounds Canvas boundaries to filter enemies (optional)
   */
  public getNearestEnemy(
    position: Vector2,
    maxDistance?: number,
    canvasBounds?: { width: number; height: number },
  ): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDistSq = maxDistance ? maxDistance * maxDistance : Infinity;

    this.getActiveEnemies().forEach((enemy) => {
      // Filter out enemies outside the map bounds
      if (canvasBounds) {
        const mapRect = {
          position: { x: 0, y: 0 },
          width: canvasBounds.width,
          height: canvasBounds.height,
        };
        if (!pointInRect(enemy.position, mapRect)) return; // Skip enemies outside
      }

      const distSq = distanceSquared(enemy.position, position);

      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    });

    return nearest;
  }

  /**
   * Find pickups within radius of a point
   */
  public getPickupsInRadius(position: Vector2, radius: number): Pickup[] {
    const radiusSq = radius * radius;
    return this.getActivePickups().filter((pickup) => {
      return distanceSquared(pickup.position, position) <= radiusSq;
    });
  }

  // ========== Debug ==========

  private log(message: string): void {
    if (this.debug) {
      console.log(`[EntityManager] ${message}`);
    }
  }
}
