import { Vector2 } from '@/utils';
import { VisualEffect } from './enums';

/**
 * Component interfaces for entity composition.
 * These interfaces define reusable behaviors that can be composed together.
 */

// ============ CORE COMPONENTS ============

/**
 * Position in 2D space
 */
// TODO Use as a composition component, do not implement directly
export interface ITransform {
  position: Vector2;
  // TODO potentially add later
  // rotation: number;
  // scale: Vector2;
}

/**
 * Movement velocity
 */
export interface IVelocity {
  vx: number;
  vy: number;
}

/**
 * Circular collision boundary
 */
export interface ICircleCollider {
  radius: number;
}

/**
 * Can be rendered to canvas
 */
export interface IRenderable {
  draw(ctx: CanvasRenderingContext2D): void;
}

/**
 * Can be updated each frame
 */
export interface IUpdatable {
  update(deltaTime: number): void;
}

// ============ COMBAT COMPONENTS ============

/**
 * Has health and can take damage
 */
export interface IHealth {
  hp: number;
  maxHp: number;
  heal(amount: number): void;
  isDead(): boolean;
}

/**
 * Can deal damage
 */
export interface IDamageDealer {
  damage: number;
}

/**
 * Can be knocked back by force
 */
export interface IKnockbackable {
  knockbackX: number;
  knockbackY: number;
  applyKnockback(forceX: number, forceY: number): void;
}

/**
 * Explosive component data
 */
export interface IExplosive {
  explosionRadius: number;
  explosionDamage: number;
  visualEffect?: VisualEffect;
}

/**
 * Pierce component data
 */
export interface IPierce {
  pierceCount: number;
}

// ============ UTILITY COMPONENTS ============

/**
 * Has a limited lifetime and expires
 */
export interface IExpirable {
  lifetime: number;
  isExpired(): boolean;
}

/**
 * Can be collected by player
 */
export interface ICollectible {
  value: number;
  collect(): number;
}
