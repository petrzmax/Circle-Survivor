/**
 * Projectile entity class.
 * Represents flying bullets, rockets, and other projectiles.
 * Uses composition with optional components for different behaviors.
 */

import { renderProjectile } from '@/rendering';
import { IExpirable, IExplosive } from '@/types/components';
import { ProjectileType, VisualEffect } from '@/types/enums';
import { Vector2, distance } from '@/utils';
import { Entity, EntityConfig } from './Entity';

/**
 * Explosive component data
 */
export interface ExplosiveComponent extends IExplosive {
  visualEffect: VisualEffect;
}

/**
 * Pierce component data with tracking
 */
export interface PierceComponent {
  pierceCount: number;
  /** Set of enemy IDs already hit (prevents double-hit) */
  hitEnemies: Set<number>;
}

/**
 * Projectile configuration
 */
export interface ProjectileConfig extends EntityConfig {
  type: ProjectileType;
  damage: number;
  ownerId: number;
  color?: string;

  // Lifetime
  maxDistance?: number;
  lifetime?: number;

  // Optional components
  explosive?: ExplosiveComponent;
  pierce?: PierceComponent;

  // Special behaviors
  rotationSpeed?: number;
  returnToOwner?: boolean;

  // Grenade behavior
  weaponCategory?: string;
  explosiveRange?: number;
  bulletSpeed?: number;
}

/**
 * Projectile entity
 * Flying objects that deal damage to enemies.
 */
export class Projectile extends Entity implements IExpirable {
  /** Projectile type determines behavior */
  public readonly type: ProjectileType;

  /** Damage dealt on hit */
  public damage: number;

  /** Owner entity ID (player) */
  public readonly ownerId: number;

  /** Projectile color for rendering */
  public color: string;

  /** Distance traveled */
  public distanceTraveled: number = 0;

  /** Maximum travel distance (0 = infinite) */
  public maxDistance: number;

  /** Remaining lifetime in seconds (Infinity = no limit) */
  public lifetime: number;

  /** Whether this was a critical hit */
  public isCrit: boolean = false;

  /** Knockback multiplier */
  public knockbackMultiplier: number = 1;

  /** Weapon category this projectile came from */
  public weaponCategory: string = 'gun';

  /** Explosive range for grenades (distance at which they explode) */
  public explosiveRange: number = 0;

  /** Base speed for grenade slowdown calculation */
  public baseSpeed: number = 0;

  /** Whether grenade should explode when it expires (reached target distance) */
  public shouldExplodeOnExpire: boolean = false;

  /** Spawn position for distance calculation */
  public readonly spawnPosition: Vector2;

  // ============ Optional Components ============

  /** Explosive component - causes area damage on impact */
  public explosive: ExplosiveComponent | null = null;

  /** Pierce component - passes through enemies */
  public pierce: PierceComponent | null = null;

  // ============ Special Behaviors ============

  /** Rotation angle (for scythe, etc.) */
  public rotation: number = 0;

  /** Rotation speed in radians/second */
  public rotationSpeed: number = 0;

  /** Whether projectile returns to owner (boomerang behavior) */
  public returnToOwner: boolean = false;

  /** Whether projectile is returning */
  public isReturning: boolean = false;

  public constructor(config: ProjectileConfig) {
    super(config);

    this.type = config.type;
    this.damage = config.damage;
    this.ownerId = config.ownerId;
    this.color = config.color ?? '#ffff00';
    this.maxDistance = config.maxDistance ?? 0;
    this.lifetime = config.lifetime ?? Infinity;
    this.spawnPosition = { ...config.position };

    // Grenade behavior
    this.weaponCategory = config.weaponCategory ?? 'gun';
    this.explosiveRange = config.explosiveRange ?? 0;
    // Base speed for grenade slowdown calculation
    this.baseSpeed = config.bulletSpeed ?? 0;

    // Initialize optional components
    if (config.explosive) {
      this.explosive = { ...config.explosive };
    }

    if (config.pierce) {
      this.pierce = {
        ...config.pierce,
        hitEnemies: new Set(),
      };
    }

    // Special behaviors
    this.rotationSpeed = config.rotationSpeed ?? 0;
    this.returnToOwner = config.returnToOwner ?? false;
  }

  // ============ Component Helpers ============

  /**
   * Checks if projectile is explosive
   */
  public isExplosive(): boolean {
    return this.explosive !== null;
  }

  /**
   * Checks if projectile can pierce
   */
  public canPierce(): boolean {
    return this.pierce !== null && this.pierce.pierceCount > 0;
  }

  /**
   * Registers a hit on enemy (for pierce tracking)
   * @param enemyId Enemy ID that was hit
   * @returns true if this is a new hit, false if already hit
   */
  public registerHit(enemyId: number): boolean {
    if (this.pierce) {
      if (this.pierce.hitEnemies.has(enemyId)) {
        return false;
      }
      this.pierce.hitEnemies.add(enemyId);
      this.pierce.pierceCount--;
    }
    return true;
  }

  // ============ Expirable Interface ============

  /**
   * Checks if projectile has expired
   */
  public isExpired(): boolean {
    if (this.lifetime <= 0) return true;
    if (this.maxDistance > 0 && this.distanceTraveled >= this.maxDistance) {
      return true;
    }
    // Grenades expire when they reach their explosive range
    if (this.shouldExplodeOnExpire) {
      return true;
    }
    return false;
  }

  // ============ Update & Draw ============

  /**
   * Updates projectile state
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update lifetime
    this.lifetime -= deltaTime;

    // Update rotation
    if (this.rotationSpeed !== 0) {
      this.rotation += this.rotationSpeed * deltaTime;
    }

    // Apply velocity first
    this.applyVelocity(deltaTime);

    // Calculate distance traveled
    if (this.weaponCategory === 'grenade' && this.explosiveRange > 0) {
      // Grenades: distance from spawn point
      this.distanceTraveled = distance(this.spawnPosition, this.position);

      const progress = this.distanceTraveled / this.explosiveRange;

      if (progress > 0.7 && progress < 1) {
        // Ease-out: speed decreases from 100% to ~10% in last 30%
        const slowdownProgress = (progress - 0.7) / 0.3;
        const speedMultiplier = Math.max(0.1, 1 - slowdownProgress * 0.9);

        // Get current velocity and apply slowdown
        const vel = this.getVelocity();
        const currentSpeed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
        if (currentSpeed > 0.1) {
          const targetSpeed = this.baseSpeed * speedMultiplier;
          const scale = targetSpeed / currentSpeed;
          this.setVelocity(vel.vx * scale, vel.vy * scale);
        }
      }

      if (progress >= 1) {
        this.shouldExplodeOnExpire = true;
      }
    } else {
      // TODO needed?
      // Other projectiles: distance from spawn point
      this.distanceTraveled = distance(this.spawnPosition, this.position);
    }

    // Check expiration
    if (this.isExpired()) {
      this.destroy();
    }
  }

  // TODO move to rendererSystem
  /**
   * Draws projectile
   * @param ctx Canvas rendering context
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    renderProjectile(ctx, this);
  }
}
