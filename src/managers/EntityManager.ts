/**
 * EntityManager - Centralized entity lifecycle management.
 * Handles adding, removing, and querying game entities.
 *
 * Future: Object pooling can be added here to reduce GC pressure.
 */

import { Entity } from '@/entities/Entity';
import { Enemy } from '@/entities/Enemy';
import { Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import { Deployable } from '@/entities/Deployable';
import { Pickup } from '@/entities/Pickup';

/**
 * Entity categories for typed retrieval
 */
export type EntityCategory = 'player' | 'enemy' | 'projectile' | 'deployable' | 'pickup';

/**
 * EntityManager configuration
 */
export interface EntityManagerConfig {
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Manages all game entities with typed collections.
 * Provides efficient add/remove/query operations.
 *
 * @example
 * ```typescript
 * const manager = new EntityManager();
 *
 * // Add entities
 * manager.addEnemy(enemy);
 * manager.addProjectile(projectile);
 *
 * // Query entities
 * const enemies = manager.getEnemies();
 * const activeProjectiles = manager.getProjectiles().filter(p => p.isActive);
 *
 * // Update all
 * manager.updateAll(deltaTime);
 *
 * // Cleanup dead entities
 * manager.removeInactive();
 * ```
 */
export class EntityManager {
  /** Current player (single instance) */
  private player: Player | null = null;

  /** Active enemies */
  private enemies = new Map<number, Enemy>();

  /** Active projectiles (player and enemy) */
  private projectiles = new Map<number, Projectile>();

  /** Active deployables (mines, turrets) */
  private deployables = new Map<number, Deployable>();

  /** Active pickups */
  private pickups = new Map<number, Pickup>();

  /** Debug mode */
  private debug: boolean;

  constructor(config: EntityManagerConfig = {}) {
    this.debug = config.debug ?? false;
  }

  // ========== Player ==========

  /**
   * Set the player entity
   */
  setPlayer(player: Player): void {
    this.player = player;
    this.log('Player set');
  }

  /**
   * Get the current player
   */
  getPlayer(): Player | null {
    return this.player;
  }

  /**
   * Remove the player
   */
  removePlayer(): void {
    this.player = null;
    this.log('Player removed');
  }

  // ========== Enemies ==========

  /**
   * Add an enemy
   */
  addEnemy(enemy: Enemy): void {
    this.enemies.set(enemy.id, enemy);
    this.log(`Enemy added: ${enemy.id} (type: ${enemy.type})`);
  }

  /**
   * Get all enemies
   */
  getEnemies(): Enemy[] {
    return Array.from(this.enemies.values());
  }

  /**
   * Get active enemies only
   */
  getActiveEnemies(): Enemy[] {
    return this.getEnemies().filter((e) => e.isActive && !e.isDead());
  }

  /**
   * Get enemy by ID
   */
  getEnemy(id: number): Enemy | undefined {
    return this.enemies.get(id);
  }

  /**
   * Remove an enemy
   */
  removeEnemy(id: number): boolean {
    const removed = this.enemies.delete(id);
    if (removed) this.log(`Enemy removed: ${id}`);
    return removed;
  }

  /**
   * Get enemy count
   */
  getEnemyCount(): number {
    return this.enemies.size;
  }

  /**
   * Get active enemy count
   */
  getActiveEnemyCount(): number {
    return this.getActiveEnemies().length;
  }

  // ========== Projectiles ==========

  /**
   * Add a projectile
   */
  addProjectile(projectile: Projectile): void {
    this.projectiles.set(projectile.id, projectile);
    this.log(`Projectile added: ${projectile.id} (type: ${projectile.type})`);
  }

  /**
   * Add multiple projectiles at once
   */
  addProjectiles(projectiles: Projectile[]): void {
    projectiles.forEach((p) => { this.addProjectile(p); });
  }

  /**
   * Get all projectiles
   */
  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values());
  }

  /**
   * Get active projectiles only
   */
  getActiveProjectiles(): Projectile[] {
    return this.getProjectiles().filter((p) => p.isActive);
  }

  /**
   * Get player projectiles (ownerId matches player)
   */
  getPlayerProjectiles(): Projectile[] {
    const playerId = this.player?.id;
    if (playerId === undefined) return [];
    return this.getActiveProjectiles().filter((p) => p.ownerId === playerId);
  }

  /**
   * Get enemy projectiles
   */
  getEnemyProjectiles(): Projectile[] {
    const playerId = this.player?.id;
    return this.getActiveProjectiles().filter((p) => p.ownerId !== playerId);
  }

  /**
   * Remove a projectile
   */
  removeProjectile(id: number): boolean {
    const removed = this.projectiles.delete(id);
    if (removed) this.log(`Projectile removed: ${id}`);
    return removed;
  }

  // ========== Deployables ==========

  /**
   * Add a deployable
   */
  addDeployable(deployable: Deployable): void {
    this.deployables.set(deployable.id, deployable);
    this.log(`Deployable added: ${deployable.id} (type: ${deployable.type})`);
  }

  /**
   * Get all deployables
   */
  getDeployables(): Deployable[] {
    return Array.from(this.deployables.values());
  }

  /**
   * Get active deployables only
   */
  getActiveDeployables(): Deployable[] {
    return this.getDeployables().filter((d) => d.isActive);
  }

  /**
   * Get armed deployables (ready to trigger)
   */
  getArmedDeployables(): Deployable[] {
    return this.getActiveDeployables().filter((d) => d.isArmed);
  }

  /**
   * Remove a deployable
   */
  removeDeployable(id: number): boolean {
    const removed = this.deployables.delete(id);
    if (removed) this.log(`Deployable removed: ${id}`);
    return removed;
  }

  // ========== Pickups ==========

  /**
   * Add a pickup
   */
  addPickup(pickup: Pickup): void {
    this.pickups.set(pickup.id, pickup);
    this.log(`Pickup added: ${pickup.id} (type: ${pickup.type})`);
  }

  /**
   * Get all pickups
   */
  getPickups(): Pickup[] {
    return Array.from(this.pickups.values());
  }

  /**
   * Get active pickups only
   */
  getActivePickups(): Pickup[] {
    return this.getPickups().filter((p) => p.isActive);
  }

  /**
   * Remove a pickup
   */
  removePickup(id: number): boolean {
    const removed = this.pickups.delete(id);
    if (removed) this.log(`Pickup removed: ${id}`);
    return removed;
  }

  // ========== Bulk Operations ==========

  /**
   * Update all entities
   */
  updateAll(deltaTime: number): void {
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
  removeInactive(): number {
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
  getTotalCount(): number {
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
  getCounts(): Record<EntityCategory, number> {
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
  getAllEntities(): Entity[] {
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
  clear(): void {
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
  clearExceptPlayer(): void {
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
  getEnemiesInRadius(x: number, y: number, radius: number): Enemy[] {
    const radiusSq = radius * radius;
    return this.getActiveEnemies().filter((enemy) => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      return dx * dx + dy * dy <= radiusSq;
    });
  }

  /**
   * Find nearest enemy to a point
   */
  getNearestEnemy(x: number, y: number, maxDistance?: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDistSq = maxDistance ? maxDistance * maxDistance : Infinity;

    this.getActiveEnemies().forEach((enemy) => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;

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
  getPickupsInRadius(x: number, y: number, radius: number): Pickup[] {
    const radiusSq = radius * radius;
    return this.getActivePickups().filter((pickup) => {
      const dx = pickup.x - x;
      const dy = pickup.y - y;
      return dx * dx + dy * dy <= radiusSq;
    });
  }

  // ========== Debug ==========

  private log(message: string): void {
    if (this.debug) {
      console.log(`[EntityManager] ${message}`);
    }
  }
}
