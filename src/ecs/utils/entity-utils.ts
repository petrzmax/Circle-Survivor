/**
 * Trait-generic entity utility functions.
 * Operate on any Koota Entity with the required traits.
 * Only shared here when ≥2 systems need the same trait operation.
 *
 * IMPORTANT: SoA traits (Position, Velocity, Health, Knockback, Damage, Lifetime, Collider)
 * return COPIES from entity.get(). Always use entity.set() to persist changes.
 * AoS traits (PlayerStats, EnemyData, etc.) return live references — direct mutation works.
 */

import type { Entity } from 'koota';
import { Health, IsDead, Knockback, Position } from '@/ecs/traits';

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
 * Apply knockback force to any entity with Knockback and Position traits.
 * Direction is away from source point.
 */
export function applyKnockback(entity: Entity, srcX: number, srcY: number, force: number): void {
  const pos = entity.get(Position);
  if (!pos) return;
  if (!entity.has(Knockback)) return;

  const dx = pos.x - srcX;
  const dy = pos.y - srcY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  entity.set(Knockback, {
    x: (dx / dist) * force,
    y: (dy / dist) * force,
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
