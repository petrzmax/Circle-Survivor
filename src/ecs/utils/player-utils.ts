/**
 * Player-specific utility functions for Koota entities.
 * Operations that were previously adapter methods, now trait-based.
 */

import { GAME_BALANCE } from '@/config';
import type { InputState, PlayerStats as PlayerStatsType } from '@/domain/player/type';
import type { WeaponInstance } from '@/domain/weapons/type';
import { Health, PlayerCharacter, PlayerStats, Position, WeaponInventory } from '@/ecs/traits';
import { applyImpulse, steadyStateForceFactor } from '@/ecs/utils/entity-utils';
import { type Vector2 } from '@/utils';
import { TWO_PI } from '@/utils/math';
import type { Entity } from 'koota';

/**
 * Remove a weapon at the given index. Returns the removed weapon or null.
 */
export function removeWeaponAt(entity: Entity, index: number): WeaponInstance | null {
  const inv = entity.get(WeaponInventory)!;
  if (index < 0 || index >= inv.weapons.length) return null;
  const [removed] = inv.weapons.splice(index, 1);
  return removed ?? null;
}

/**
 * Add an item ID to the player's item list.
 */
export function addItem(entity: Entity, itemId: string): void {
  const inv = entity.get(WeaponInventory)!;
  inv.items.push(itemId);
}

/**
 * Count occurrences of an item in the player's inventory.
 */
export function countItem(entity: Entity, itemId: string): number {
  const inv = entity.get(WeaponInventory)!;
  return inv.items.filter((i) => i === itemId).length;
}

/** Stats with special clamping rules: stat key → max value getter. */
const STAT_CLAMPS: Partial<Record<keyof PlayerStatsType, () => number>> = {
  dodge: () => GAME_BALANCE.player.maxDodge,
};

/**
 * Apply a stat modification to the player.
 */
export function applyStat(entity: Entity, stat: keyof PlayerStatsType, value: number): void {
  // maxHp is special — it lives on the Health trait, not PlayerStats
  if (stat === 'maxHp') {
    const h = entity.get(Health)!;
    entity.set(Health, { hp: h.hp + value, maxHp: h.maxHp + value });
    return;
  }

  const stats = entity.get(PlayerStats)!;
  const field = stat as keyof typeof stats;

  const current = stats[field] as number;
  const maxGetter = STAT_CLAMPS[stat];
  (stats[field] as number) = maxGetter ? Math.min(current + value, maxGetter()) : current + value;
}

/**
 * Calculate weapon position relative to the player for the given weapon index.
 */
export function getWeaponPosition(
  entity: Entity,
  index: number,
  target: Vector2 | null = null,
): { x: number; y: number; angle: number } {
  const weaponRadius = 25;
  const inv = entity.get(WeaponInventory)!;
  const weaponCount = inv.weapons.length || 1;

  const spreadAngle = (TWO_PI / weaponCount) * index;

  const pos = entity.get(Position)!;
  const posX = pos.x + Math.cos(spreadAngle) * weaponRadius;
  const posY = pos.y + Math.sin(spreadAngle) * weaponRadius;

  let aimAngle = spreadAngle;
  if (target) {
    aimAngle = Math.atan2(target.y - posY, target.x - posX);
  }

  return { x: posX, y: posY, angle: aimAngle };
}

/**
 * Get the effective movement speed of the player.
 */
export function getPlayerSpeed(entity: Entity): number {
  const stats = entity.get(PlayerStats)!;
  const char = entity.get(PlayerCharacter)!;
  return char.characterConfig!.speed * stats.speedMultiplier;
}

/**
 * Update player movement via exact-force steering.
 * Uses the same approach as EnemySystem: computes the impulse that produces
 * exactly the desired speed at steady state after friction decay.
 * Knockback decays naturally through friction — no active correction fighting it.
 * PhysicsSystem integrates impulse→velocity→position and ArenaBound handles bounds clamping.
 */
export function updatePlayerMovement(entity: Entity, input: InputState, deltaTime: number): void {
  let dirX = 0;
  let dirY = 0;

  if (input.analogX !== undefined && input.analogY !== undefined) {
    dirX = input.analogX;
    dirY = input.analogY;
  } else {
    if (input.up) dirY = -1;
    if (input.down) dirY = 1;
    if (input.left) dirX = -1;
    if (input.right) dirX = 1;

    if (dirX !== 0 && dirY !== 0) {
      dirX *= 0.707;
      dirY *= 0.707;
    }
  }

  if (dirX === 0 && dirY === 0) return;

  const spd = getPlayerSpeed(entity);
  const forceFactor = steadyStateForceFactor(entity, deltaTime);

  applyImpulse(entity, { x: dirX * spd * forceFactor, y: dirY * spd * forceFactor });
}
