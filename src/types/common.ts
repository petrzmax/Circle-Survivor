/**
 * Shared type definitions for game entities and components.
 */

import type { Vector2 } from '@/utils';
import { DeployableType, PickupType, VisualEffect } from './enums';

/**
 * Canvas / arena dimensions
 */
export interface CanvasBounds {
  width: number;
  height: number;
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
 * Explosive component data
 */
export interface IExplosive {
  explosionRadius: number;
  explosionDamage: number;
  visualEffect?: VisualEffect;
}

/**
 * Pickup configuration
 */
export interface PickupConfig {
  position: Vector2;
  type: PickupType;
  value: number;
  /** Lifetime in seconds (default: 30) */
  lifetime?: number;
}

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
