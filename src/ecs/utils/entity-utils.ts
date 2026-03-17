/**
 * Trait-generic entity utility functions.
 * Operate on any Koota Entity with the required traits.
 * Only shared here when ≥2 systems need the same trait operation.
 *
 * IMPORTANT: SoA traits (Position, Velocity, Health, PhysicsBody, Damage, Lifetime, Collider)
 * return COPIES from entity.get(). Always use entity.set() to persist changes.
 * AoS traits (PlayerStats, EnemyData, etc.) return live references — direct mutation works.
 */

import type { Entity } from 'koota';
import { Health, IsDead, PhysicsBody, Position } from '@/ecs/traits';
import { normalize, scaleVector, subtractVectors, type Vector2 } from '@/utils/math';

/**
 * Apply damage to any entity with a Health trait.
 */
export function damageEntity(entity: Entity, amount: number): void {
  const h = entity.get(Health);
  if (!h) return;
  entity.set(Health, { hp: h.hp - amount, maxHp: h.maxHp });
}

/**
 * Heal any entity with a Health trait (clamps to maxHp).
 */
export function healEntity(entity: Entity, amount: number): void {
  const h = entity.get(Health);
  if (!h) return;
  entity.set(Health, { hp: Math.min(h.maxHp, h.hp + amount), maxHp: h.maxHp });
}

/**
 * Fully restore an entity's HP to maxHp.
 */
export function fullHealEntity(entity: Entity): void {
  const h = entity.get(Health);
  if (!h) return;
  entity.set(Health, { hp: h.maxHp, maxHp: h.maxHp });
}

/**
 * Accumulate impulse on an entity's PhysicsBody trait.
 * Impulses are additive — multiple calls per frame stack correctly.
 * PhysicsSystem clears impulses after each tick.
 */
export function applyImpulse(entity: Entity, impulse: Vector2): void {
  const body = entity.get(PhysicsBody);
  if (!body) return;

  entity.set(PhysicsBody, {
    mass: body.mass,
    friction: body.friction,
    impulseX: body.impulseX + impulse.x,
    impulseY: body.impulseY + impulse.y,
  });
}

/**
 * Push entity away from a source point with given magnitude.
 * Handles direction computation and normalization internally.
 */
export function applyImpulseAwayFrom(entity: Entity, source: Vector2, magnitude: number): void {
  const pos = entity.get(Position);
  if (!pos) return;

  const direction = normalize(subtractVectors(pos, source));
  if (direction.x === 0 && direction.y === 0) return;

  applyImpulse(entity, scaleVector(direction, magnitude));
}

/**
 * Kill any entity: set health to 0 and add IsDead tag.
 */
export function killEntity(entity: Entity): void {
  const h = entity.get(Health);
  if (h) {
    entity.set(Health, { hp: 0, maxHp: h.maxHp });
  }
  if (!entity.has(IsDead)) {
    entity.add(IsDead);
  }
}
