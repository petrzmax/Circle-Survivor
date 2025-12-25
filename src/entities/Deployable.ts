/**
 * Deployable entity class.
 * Represents static objects placed in the world: mines, turrets, traps.
 * Unlike Projectile, Deployable doesn't have velocity - it stays in place.
 */

import { Entity, EntityConfig } from './Entity';
import { DeployableType, VisualEffect } from '@/types/enums';
import { IExpirable, IExplosive } from '@/types/components';
import { randomInt } from '@/utils';
import { TWO_PI } from '@/utils/math';

/**
 * Deployable configuration
 */
export interface DeployableConfig extends Omit<EntityConfig, 'vx' | 'vy'> {
  type: DeployableType;
  damage: number;
  ownerId: number;
  color?: string;

  // Lifetime
  lifetime?: number;

  // Explosion settings (for mines)
  explosionRadius?: number;
  explosionDamage?: number;
  visualEffect?: VisualEffect;

  // Trigger settings
  triggerRadius?: number;
  armingTime?: number;
}

/**
 * Deployable entity
 * Static objects that interact with enemies (mines explode, turrets shoot, etc.)
 */
export class Deployable extends Entity implements IExpirable {
  /** Deployable type determines behavior */
  public readonly type: DeployableType;

  /** Damage dealt */
  public damage: number;

  /** Owner entity ID (player) */
  public readonly ownerId: number;

  /** Deployable color for rendering */
  public color: string;

  /** Remaining lifetime in seconds (Infinity = no limit) */
  public lifetime: number;

  // ============ Explosion (for mines) ============

  /** Explosion radius (0 = not explosive) */
  public explosionRadius: number;

  /** Explosion damage (may differ from contact damage) */
  public explosionDamage: number;

  /** Visual effect for explosion */
  public visualEffect: VisualEffect;

  // ============ Trigger Settings ============

  /** Detection radius for triggering */
  public triggerRadius: number;

  /** Time before deployable becomes active (seconds) */
  public armingTime: number;

  /** Whether deployable is armed and ready */
  public isArmed: boolean = false;

  /** Animation state */
  public animationTime: number = 0;

  /** Blink offset for staggered blinking (based on creation time) */
  private readonly blinkOffset: number;

  public constructor(config: DeployableConfig) {
    // Deployables don't have velocity
    super({ ...config, vx: undefined, vy: undefined });

    this.type = config.type;
    this.damage = config.damage;
    this.ownerId = config.ownerId;
    this.color = config.color ?? '#333333';
    this.lifetime = config.lifetime ?? Infinity;

    // Explosion settings
    this.explosionRadius = config.explosionRadius ?? 0;
    this.explosionDamage = config.explosionDamage ?? config.damage;
    this.visualEffect = config.visualEffect ?? VisualEffect.STANDARD;

    // Trigger settings
    this.triggerRadius = config.triggerRadius ?? config.radius * 2;
    this.armingTime = config.armingTime ?? 0.5; // 0.5s default arming time

    // Start unarmed if arming time > 0
    this.isArmed = this.armingTime <= 0;

    // Random offset for staggered blinking
    this.blinkOffset = randomInt(0, 1000);
  }

  // ============ State Helpers ============

  /**
   * Checks if deployable is explosive
   */
  public isExplosive(): boolean {
    return this.explosionRadius > 0;
  }

  /**
   * Gets explosive component data
   */
  public getExplosive(): IExplosive | null {
    if (!this.isExplosive()) return null;
    return {
      explosionRadius: this.explosionRadius,
      explosionDamage: this.explosionDamage,
    };
  }

  /**
   * Checks if deployable has expired
   */
  public isExpired(): boolean {
    return this.lifetime <= 0;
  }

  /**
   * Triggers the deployable (e.g., mine explodes)
   * Returns explosion data if applicable
   */
  public trigger(): IExplosive | null {
    if (!this.isArmed) return null;

    this.destroy();

    if (this.isExplosive()) {
      return {
        explosionRadius: this.explosionRadius,
        explosionDamage: this.explosionDamage,
      };
    }

    return null;
  }

  // ============ Update & Draw ============

  /**
   * Updates deployable state
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update lifetime
    this.lifetime -= deltaTime;

    // Update arming
    if (!this.isArmed) {
      this.armingTime -= deltaTime;
      if (this.armingTime <= 0) {
        this.isArmed = true;
      }
    }

    // Update animation
    this.animationTime += deltaTime;

    // Check expiration
    if (this.isExpired()) {
      this.destroy();
    }
  }

  /**
   * Draws deployable
   * @param ctx Canvas rendering context
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    switch (this.type) {
      case DeployableType.MINE:
        this.drawMine(ctx);
        break;
      case DeployableType.TURRET:
        this.drawTurret(ctx);
        break;
      case DeployableType.TRAP:
        this.drawTrap(ctx);
        break;
    }

    ctx.restore();
  }

  // ============ Draw Helpers ============

  private drawMine(ctx: CanvasRenderingContext2D): void {
    // Mine - dark circle with blinking red light when armed (like original)
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, TWO_PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Blinking red light when armed (with offset for staggered blinking)
    if (this.isArmed) {
      ctx.beginPath();
      ctx.arc(0, -3, 3, 0, TWO_PI);
      ctx.fillStyle = Math.floor((Date.now() + this.blinkOffset) / 200) % 2 ? '#ff0000' : '#440000';
      ctx.fill();
    }
  }

  private drawTurret(ctx: CanvasRenderingContext2D): void {
    // Base
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, TWO_PI);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Barrel
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, -this.radius * 0.2, this.radius * 1.5, this.radius * 0.4);
  }

  private drawTrap(ctx: CanvasRenderingContext2D): void {
    // Spike trap
    const spikes = 8;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * TWO_PI;
      const innerRadius = this.radius * 0.5;
      const outerRadius = this.radius;

      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      } else {
        ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      }

      const midAngle = angle + Math.PI / spikes;
      ctx.lineTo(Math.cos(midAngle) * innerRadius, Math.sin(midAngle) * innerRadius);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
