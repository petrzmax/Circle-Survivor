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
  Collider,
  Health,
  PlayerCharacter,
  PlayerStats,
  Position,
  Velocity,
  WeaponInventory,
} from '@/ecs/traits';
import { clamp, type CanvasBounds, type Vector2 } from '@/utils';
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
 * Update player movement based on input state.
 */
export function updatePlayerMovement(
  entity: Entity,
  input: InputState,
  bounds: CanvasBounds,
  deltaTime: number,
): void {
  let vx = 0;
  let vy = 0;

  if (input.analogX !== undefined && input.analogY !== undefined) {
    vx = input.analogX;
    vy = input.analogY;
  } else {
    if (input.up) vy = -1;
    if (input.down) vy = 1;
    if (input.left) vx = -1;
    if (input.right) vx = 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }
  }

  const spd = getPlayerSpeed(entity);
  const pos = entity.get(Position)!;
  const char = entity.get(PlayerCharacter)!;
  const col = entity.get(Collider)!;

  let newX = pos.x + vx * spd * deltaTime;
  let newY = pos.y + vy * spd * deltaTime;

  const w = char.width;
  const h = char.height;
  newX = clamp(newX, w / 2, bounds.width - w / 2);
  newY = clamp(newY, h / 2, bounds.height - h / 2);

  entity.set(Position, { x: newX, y: newY });
  entity.set(Velocity, { vx: vx * spd, vy: vy * spd });

  // Sync collider with half of character width as radius (existing behavior)
  void col;
}
