/**
 * Base Entity class using composition pattern.
 * All game objects inherit from this class.
 */

import { ITransform, IVelocity, ICircleCollider } from '@/types/components';
import { Vector2, normalize } from '@/utils';

/**
 * Unique entity ID counter
 */
let nextEntityId = 0;

/**
 * Generates unique entity ID
 */
export function generateEntityId(): number {
  return nextEntityId++;
}

/**
 * Resets entity ID counter (useful for tests)
 */
export function resetEntityIdCounter(): void {
  nextEntityId = 0;
}

/**
 * Base entity configuration
 */
export interface EntityConfig {
  x: number;
  y: number;
  radius: number;
  vx?: number;
  vy?: number;
}

/**
 * Base Entity class
 * Provides transform, optional velocity, and circle collider components.
 * Uses composition - extend and add more components as needed.
 */
export abstract class Entity implements ITransform, ICircleCollider {
  /** Unique entity identifier */
  public readonly id: number;

  /** Position X */
  public x: number;

  /** Position Y */
  public y: number;

  /** Collision radius */
  public radius: number;

  /** Whether entity is active (false = should be removed) */
  public isActive: boolean = true;

  /** Optional velocity component */
  protected velocity: IVelocity | null = null;

  public constructor(config: EntityConfig) {
    this.id = generateEntityId();
    this.x = config.x;
    this.y = config.y;
    this.radius = config.radius;

    if (config.vx !== undefined || config.vy !== undefined) {
      this.velocity = {
        vx: config.vx ?? 0,
        vy: config.vy ?? 0,
      };
    }
  }

  /**
   * Gets velocity component (creates if needed)
   */
  public getVelocity(): IVelocity {
    this.velocity ??= { vx: 0, vy: 0 };
    return this.velocity;
  }

  /**
   * Checks if entity has velocity
   */
  public hasVelocity(): boolean {
    return this.velocity !== null;
  }

  /**
   * Sets velocity
   */
  public setVelocity(vx: number, vy: number): void {
    if (!this.velocity) {
      this.velocity = { vx, vy };
    } else {
      this.velocity.vx = vx;
      this.velocity.vy = vy;
    }
  }

  /**
   * Gets position as Vector2
   */
  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  /**
   * Sets position
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Moves entity by velocity * deltaTime
   * @param deltaTime Time since last frame in seconds
   */
  public applyVelocity(deltaTime: number): void {
    if (this.velocity) {
      this.x += this.velocity.vx * deltaTime * 60; // Normalize to 60fps
      this.y += this.velocity.vy * deltaTime * 60;
    }
  }

  /**
   * Moves entity towards target position
   * @param target Target position
   * @param speed Movement speed
   * @param deltaTime Time since last frame
   */
  public moveTowards(target: Vector2, speed: number, deltaTime: number): void {
    const direction = normalize({
      x: target.x - this.x,
      y: target.y - this.y,
    });

    this.x += direction.x * speed * deltaTime * 60;
    this.y += direction.y * speed * deltaTime * 60;
  }

  /**
   * Applies knockback force
   * @param fromX Source X position
   * @param fromY Source Y position
   * @param force Knockback strength
   */
  public applyKnockback(fromX: number, fromY: number, force: number): void {
    const direction = normalize({
      x: this.x - fromX,
      y: this.y - fromY,
    });

    const vel = this.getVelocity();
    vel.vx += direction.x * force;
    vel.vy += direction.y * force;
  }

  /**
   * Applies friction to velocity
   * @param friction Friction factor (0-1, lower = more friction)
   */
  public applyFriction(friction: number): void {
    if (this.velocity) {
      this.velocity.vx *= friction;
      this.velocity.vy *= friction;
    }
  }

  /**
   * Marks entity for removal
   */
  public destroy(): void {
    this.isActive = false;
  }

  /**
   * Abstract update method - must be implemented by subclasses
   * @param deltaTime Time since last frame in seconds
   */
  public abstract update(deltaTime: number): void;

  /**
   * Abstract draw method - must be implemented by subclasses
   * @param ctx Canvas rendering context
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void;
}
