/**
 * Projectile entity class.
 * Represents flying bullets, rockets, and other projectiles.
 * Uses composition with optional components for different behaviors.
 */

import { Entity, EntityConfig } from './Entity';
import { ProjectileType, VisualEffect } from '@/types/enums';
import { IExpirable, IExplosive } from '@/types/components';
import { Vector2, distance } from '@/utils';

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
 * Chain component data with tracking
 */
export interface ChainComponent {
  chainCount: number;
  chainRange: number;
  /** Set of enemy IDs already chained to */
  chainedEnemies: Set<number>;
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
  chain?: ChainComponent;

  // Special behaviors
  rotationSpeed?: number;
  returnToOwner?: boolean;
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

  /** Explosive range for grenades */
  public explosiveRange: number = 0;

  /** Spawn position for distance calculation */
  public readonly spawnPosition: Vector2;

  // ============ Optional Components ============

  /** Explosive component - causes area damage on impact */
  public explosive: ExplosiveComponent | null = null;

  /** Pierce component - passes through enemies */
  public pierce: PierceComponent | null = null;

  /** Chain component - jumps between enemies */
  public chain: ChainComponent | null = null;

  // ============ Special Behaviors ============

  /** Rotation angle (for scythe, etc.) */
  public rotation: number = 0;

  /** Rotation speed in radians/second */
  public rotationSpeed: number = 0;

  /** Whether projectile returns to owner (boomerang behavior) */
  public returnToOwner: boolean = false;

  /** Whether projectile is returning */
  public isReturning: boolean = false;

  constructor(config: ProjectileConfig) {
    super(config);

    this.type = config.type;
    this.damage = config.damage;
    this.ownerId = config.ownerId;
    this.color = config.color ?? '#ffff00';
    this.maxDistance = config.maxDistance ?? 0;
    this.lifetime = config.lifetime ?? Infinity;
    this.spawnPosition = { x: config.x, y: config.y };

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

    if (config.chain) {
      this.chain = {
        ...config.chain,
        chainedEnemies: new Set(),
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
   * Checks if projectile can chain
   */
  public canChain(): boolean {
    return this.chain !== null && this.chain.chainCount > 0;
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

  /**
   * Registers a chain to enemy
   * @param enemyId Enemy ID that was chained to
   * @returns true if chain was successful
   */
  public registerChain(enemyId: number): boolean {
    if (this.chain) {
      if (this.chain.chainedEnemies.has(enemyId)) {
        return false;
      }
      this.chain.chainedEnemies.add(enemyId);
      this.chain.chainCount--;
      return true;
    }
    return false;
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

    // Store old position for distance calculation
    const oldX = this.x;
    const oldY = this.y;

    // Apply velocity
    this.applyVelocity(deltaTime);

    // Calculate distance traveled
    this.distanceTraveled += distance({ x: oldX, y: oldY }, { x: this.x, y: this.y });

    // Check expiration
    if (this.isExpired()) {
      this.destroy();
    }
  }

  /**
   * Draws projectile
   * @param ctx Canvas rendering context
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    // Draw based on projectile type
    switch (this.type) {
      case ProjectileType.ENEMY_BULLET:
        this.drawEnemyBullet(ctx);
        break;
      case ProjectileType.SCYTHE:
        this.drawScythe(ctx);
        break;
      case ProjectileType.SWORD:
        this.drawSword(ctx);
        break;
      case ProjectileType.ROCKET:
      case ProjectileType.NUKE:
        this.drawRocket(ctx);
        break;
      case ProjectileType.FLAMETHROWER:
        this.drawFlame(ctx);
        break;
      default:
        this.drawBullet(ctx);
    }

    ctx.restore();
  }

  // ============ Draw Helpers ============

  private drawBullet(ctx: CanvasRenderingContext2D): void {
    // Standard bullet with glow
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Crit indicator - red glow
    if (this.isCrit) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Normal glow matching bullet color
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }
    ctx.fill();
  }

  private drawEnemyBullet(ctx: CanvasRenderingContext2D): void {
    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // Main bullet
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Darker center
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  }

  private drawScythe(ctx: CanvasRenderingContext2D): void {
    // Crescent moon shape
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.arc(this.radius * 0.3, 0, this.radius * 0.7, 1.8 * Math.PI, 0.2 * Math.PI, true);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  private drawSword(ctx: CanvasRenderingContext2D): void {
    // Simple sword shape
    ctx.beginPath();
    ctx.moveTo(-this.radius, 0);
    ctx.lineTo(0, -this.radius * 0.3);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius * 0.3);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  private drawRocket(ctx: CanvasRenderingContext2D): void {
    // Bazooka rocket with gradient and trail
    // Note: We're already translated, so use 0,0 as center
    // But for gradient we need actual position - restore and use this.x, this.y
    ctx.restore();
    ctx.save();
    
    // Radial gradient from yellow center to dark red edge
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.7, '#ff4400');
    gradient.addColorStop(1, '#aa0000');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Trail behind rocket (using velocity direction)
    const vel = this.getVelocity();
    ctx.beginPath();
    ctx.moveTo(this.x - vel.vx * 2, this.y - vel.vy * 2);
    ctx.lineTo(this.x - vel.vx * 4, this.y - vel.vy * 4);
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  private drawFlame(ctx: CanvasRenderingContext2D): void {
    // Flickering flame
    const flicker = 0.8 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * flicker, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
