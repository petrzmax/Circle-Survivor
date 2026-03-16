/**
 * Shared ECS traits — SoA schema-based for performance.
 * These are used across multiple entity types and queried frequently.
 */

import { trait } from 'koota';
import { VisualEffect } from '@/types/enums';

/** 2D position — structurally compatible with Vector2 */
export const Position = trait({ x: 0, y: 0 });

/** Movement velocity */
export const Velocity = trait({ vx: 0, vy: 0 });

/** Circle collider radius */
export const Collider = trait({ radius: 0 });

/** Health pool */
export const Health = trait({ hp: 0, maxHp: 0 });

/** Contact/hit damage amount */
export const Damage = trait({ amount: 0 });

/** Time-limited lifetime in seconds */
export const Lifetime = trait({ remaining: Infinity });

/** Explosive component — AOE damage on trigger */
export const Explosive = trait(() => ({
  radius: 0,
  damage: 0,
  visualEffect: VisualEffect.STANDARD,
}));

/** Drop-on-death component — entities with this trait spawn pickups when killed */
export const DropsPickup = trait(() => ({
  goldValue: 0,
}));

/** Physics body — enables force-based movement with friction decay */
export const PhysicsBody = trait({ mass: 1, friction: 0, forceX: 0, forceY: 0 });
