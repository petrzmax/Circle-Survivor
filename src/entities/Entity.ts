/**
 * Base Entity class using composition pattern.
 * All game objects inherit from this class.
 */

import { ICircleCollider, ITransform, IVelocity } from '@/types/components';
import { Vector2 } from '@/utils';

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
  position: Vector2;
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
  public position: Vector2;

  /** Collision radius */
  public radius: number;

  /** Whether entity is active (false = should be removed) */
  public isActive: boolean = true;

  /** Optional velocity component */
  protected velocity: IVelocity | null = null;

  public constructor(config: EntityConfig) {
    this.id = generateEntityId();
    this.position = config.position;
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

  // TODO refactor to not use vx,vy directly - to vector2
  /**
   * Sets velocity from vector
   */
  public setVelocityVector(vector: Vector2): void {
    this.setVelocity(vector.x, vector.y);
  }

  /**
   * Gets position as Vector2
   */
  public getPosition(): Vector2 {
    return this.position;
  }

  /**
   * Sets position
   */
  public setPosition(position: Vector2): void {
    this.position = position;
  }

  /**
   * Moves entity by velocity * deltaTime
   * @param deltaTime Time since last frame in seconds
   */
  public applyVelocity(deltaTime: number): void {
    if (this.velocity) {
      // TODO IS * 60 needed - analyze
      this.position.x += this.velocity.vx * deltaTime * 60; // Normalize to 60fps
      this.position.y += this.velocity.vy * deltaTime * 60;
    }
  }

  // TODO use to grenades mechanics
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
}
