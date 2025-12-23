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
    this.spawnPosition = { x: config.x, y: config.y };

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

    // Store old position for distance calculation (for non-grenades)
    const oldX = this.x;
    const oldY = this.y;

    // Apply velocity first
    this.applyVelocity(deltaTime);

    // Calculate distance traveled
    if (this.weaponCategory === 'grenade' && this.explosiveRange > 0) {
      // Grenades: distance from spawn point (like original)
      this.distanceTraveled = distance(this.spawnPosition, { x: this.x, y: this.y });

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
      // Other projectiles: accumulated distance
      this.distanceTraveled += distance({ x: oldX, y: oldY }, { x: this.x, y: this.y });
    }

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
        this.drawRocket(ctx);
        break;
      case ProjectileType.NUKE:
        this.drawNuke(ctx);
        break;
      case ProjectileType.FLAMETHROWER:
        this.drawFlame(ctx);
        break;
      case ProjectileType.HOLY_GRENADE:
        this.drawHolyGrenade(ctx);
        break;
      case ProjectileType.BANANA:
      // falls through - mini banana uses same draw method
      case ProjectileType.MINI_BANANA:
        this.drawBanana(ctx);
        break;
      case ProjectileType.CROSSBOW_BOLT:
        this.drawCrossbowBolt(ctx);
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

  private drawNuke(ctx: CanvasRenderingContext2D): void {
    // Nuke - large glowing green ball (like original)
    ctx.restore();
    ctx.save();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#004400');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Green glow
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.fill();
  }

  private drawFlame(ctx: CanvasRenderingContext2D): void {
    // Flickering flame
    const flicker = 0.8 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * flicker, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  private drawHolyGrenade(ctx: CanvasRenderingContext2D): void {
    // Reset translation for gradient (needs absolute coords)
    ctx.restore();
    ctx.save();

    // Golden ball with gradient
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#b8860b');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Cross
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 5);
    ctx.lineTo(this.x, this.y + 5);
    ctx.moveTo(this.x - 4, this.y - 1);
    ctx.lineTo(this.x + 4, this.y - 1);
    ctx.stroke();

    // Glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
  }

  private drawBanana(ctx: CanvasRenderingContext2D): void {
    // Rotating banana - use Date.now for continuous rotation
    ctx.rotate(Date.now() / 150);

    // Banana crescent shape
    ctx.beginPath();
    ctx.arc(0, -5, this.radius, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffff00';
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cccc00';
    ctx.stroke();
  }

  private drawCrossbowBolt(ctx: CanvasRenderingContext2D): void {
    // Rotate to face direction of travel
    const vel = this.getVelocity();
    ctx.rotate(Math.atan2(vel.vy, vel.vx));

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(-this.radius, 0);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(this.radius + 4, -2);
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(this.radius + 4, 2);
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing hook (cyan)
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(this.radius, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
