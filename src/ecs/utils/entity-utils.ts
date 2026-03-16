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
import { Health, IsDead, PhysicsBody } from '@/ecs/traits';

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
 * Accumulate force on an entity's PhysicsBody trait.
 * Forces are additive — multiple calls per frame stack correctly.
 * PhysicsSystem clears forces after each tick.
 */
export function applyForce(entity: Entity, forceX: number, forceY: number): void {
  const body = entity.get(PhysicsBody);
  if (!body) return;

  entity.set(PhysicsBody, {
    mass: body.mass,
    friction: body.friction,
    forceX: body.forceX + forceX,
    forceY: body.forceY + forceY,
  });
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
