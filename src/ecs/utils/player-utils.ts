/**
 * Player-specific utility functions for Koota entities.
 * Operations that were previously adapter methods, now trait-based.
 */

import type { Entity } from 'koota';
import type { WeaponInstance } from '@/domain/weapons/type';
import type { WeaponType } from '@/domain/weapons/type';
import type { InputState, PlayerStats as PlayerStatsType } from '@/domain/player/type';
import { WEAPON_TYPES } from '@/domain/weapons';
import { GAME_BALANCE } from '@/config';
import {
  Health,
  PhysicsBody,
  PlayerCharacter,
  PlayerStats,
  Position,
  Velocity,
  WeaponInventory,
} from '@/ecs/traits';
import { applyImpulse } from '@/ecs/utils/entity-utils';
import { type Vector2 } from '@/utils';
import { TWO_PI } from '@/utils/math';

/**
 * Add a weapon to the player's inventory.
 * Returns true if weapon was added or upgraded, false if inventory full.
 */
export function addWeapon(entity: Entity, type: WeaponType): boolean {
  const inv = entity.get(WeaponInventory)!;
  const stats = entity.get(PlayerStats)!;

  if (inv.weapons.length >= stats.maxWeapons) {
    const existing = inv.weapons.find((w) => w.type === type);
    if (existing) {
      existing.level++;
      return true;
    }
    return false;
  }

  const config = WEAPON_TYPES[type];
  inv.weapons.push({
    type,
    config,
    level: 1,
    lastFireTime: 0,
    multishot: 0,
    name: config.name,
    fireOffset: 0,
  });

  return true;
}

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

/**
 * Apply a stat modification to the player.
 */
export function applyStat(entity: Entity, stat: keyof PlayerStatsType, value: number): void {
  const stats = entity.get(PlayerStats)!;
  switch (stat) {
    case 'maxHp': {
      const h = entity.get(Health)!;
      entity.set(Health, { hp: h.hp + value, maxHp: h.maxHp + value });
      break;
    }
    case 'speed':
      stats.speedMultiplier += value;
      break;
    case 'pickupRange':
      stats.pickupRange += value;
      break;
    case 'armor':
      stats.armor += value;
      break;
    case 'damageMultiplier':
      stats.damageMultiplier += value;
      break;
    case 'attackSpeedMultiplier':
      stats.attackSpeedMultiplier += value;
      break;
    case 'critChance':
      stats.critChance += value;
      break;
    case 'critDamage':
      stats.critDamage += value;
      break;
    case 'lifesteal':
      stats.lifesteal += value;
      break;
    case 'knockback':
      stats.knockback += value;
      break;
    case 'explosionRadius':
      stats.explosionRadius += value;
      break;
    case 'projectileCount':
      stats.projectileCount += value;
      break;
    case 'pierce':
      stats.pierce += value;
      break;
    case 'attackRange':
      stats.attackRange += value;
      break;
    case 'luck':
      stats.luck += value;
      break;
    case 'xpMultiplier':
      stats.xpMultiplier += value;
      break;
    case 'goldMultiplier':
      stats.goldMultiplier += value;
      break;
    case 'dodge':
      stats.dodge = Math.min(stats.dodge + value, GAME_BALANCE.player.maxDodge);
      break;
    case 'thorns':
      stats.thorns += value;
      break;
    case 'regen':
      stats.regen += value;
      break;
    case 'maxWeapons':
      stats.maxWeapons += value;
      break;
  }
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
 * Update player movement via impulse-based steering.
 * Computes desired velocity from input, then applies a steering impulse.
 * PhysicsSystem integrates impulse→velocity→position and ArenaBound handles bounds clamping.
 */
export function updatePlayerMovement(entity: Entity, input: InputState): void {
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

  const spd = getPlayerSpeed(entity);
  const desiredVx = dirX * spd;
  const desiredVy = dirY * spd;

  const vel = entity.get(Velocity)!;
  const body = entity.get(PhysicsBody)!;
  const moveResponse = GAME_BALANCE.player.moveResponse;

  // Steering impulse: push velocity toward desired, scaled by mass so PhysicsSystem divides it back out
  const impulseX = (desiredVx - vel.vx) * body.mass * moveResponse;
  const impulseY = (desiredVy - vel.vy) * body.mass * moveResponse;

  applyImpulse(entity, { x: impulseX, y: impulseY });
}
