/**
 * Deployable entity class.
 * Represents static objects placed in the world: mines, turrets, traps.
 * Unlike Projectile, Deployable doesn't have velocity - it stays in place.
 */

import { IExpirable, IExplosive } from '@/types/components';
import { DeployableType, VisualEffect } from '@/types/enums';
import { randomInt } from '@/utils';
import { Entity, EntityConfig } from './Entity';

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
  public readonly blinkOffset: number;

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
}
