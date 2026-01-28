/**
 * Player entity class.
 * The main playable character with stats, weapons, and items.
 */

import { CHARACTER_TYPES, CharacterConfig, GAME_BALANCE, WEAPON_TYPES } from '@/config';
import type { WeaponInstance } from '@/domain/weapons/type';
import { WeaponType } from '@/domain/weapons/type';
import { IHealth } from '@/types/components';
import { CharacterType } from '@/types/enums';
import { clamp, Vector2 } from '@/utils';
import { TWO_PI } from '@/utils/math';
import { Entity } from '../../entities/Entity';
import { InputState, PlayerConfig, PlayerStats } from './type';

/**
 * Player entity
 * Uses composition for weapons and items.
 */
export class Player extends Entity implements IHealth {
  /** Player size (square) */
  public width: number = 30;
  public height: number = 30;

  /** Player color */
  public color: string;

  /** Character type */
  public readonly characterType: CharacterType;

  /** Character config reference */
  public readonly characterConfig: CharacterConfig;

  // ============ Health Component ============

  public maxHp: number;
  public hp: number;

  // Resources
  public gold: number = 0;
  public xp: number = 0;

  // ============ Stats ============

  public speed: number;
  public pickupRange: number;

  // Combat
  public armor: number = 0;
  public damageMultiplier: number;
  public attackSpeedMultiplier: number = 1;
  public critChance: number = 0;
  public critDamage: number;
  public lifesteal: number = 0;
  public knockback: number = 1;
  public explosionRadius: number = 1;
  public projectileCount: number = 0;
  public pierce: number = 0;
  public attackRange: number = 1;

  // Utility
  public luck: number = 0;
  public xpMultiplier: number = 1;
  public goldMultiplier: number = 1;
  public dodge: number = 0;
  public thorns: number = 0;
  public regen: number = 0;

  // Drop chances
  public healthDropChance: number = 0;
  public healthDropValue: number = 0;
  public healthDropLuckMultiplier: number = 0;

  // Debug
  public godMode: boolean = false;

  // ============ Weapons & Items ============

  /** Maximum weapon slots */
  public maxWeapons: number = 6;

  /** Equipped weapons with runtime state */
  public weapons: WeaponInstance[] = [];

  /** Collected item IDs */
  public items: string[] = [];

  // ============ State ============

  /** Invincibility end time */
  public invincibleUntil: number = 0;

  /** Invincibility duration in ms */
  public invincibilityDuration: number;

  /** Regeneration timer */
  private regenTimer: number = 0;

  /** Current target for weapon aiming */
  public currentTarget: Vector2 | null = null;

  public constructor(config: PlayerConfig) {
    super({
      position: { x: config.x, y: config.y },
      radius: 15, // half of width
    });

    this.characterType = config.characterType ?? CharacterType.NORMIK;
    this.characterConfig = CHARACTER_TYPES[this.characterType];

    // Apply character stats
    this.color = this.characterConfig.color;
    this.maxHp = this.characterConfig.maxHp;
    this.hp = this.maxHp;
    this.speed = this.characterConfig.speed;
    this.damageMultiplier = this.characterConfig.damageMultiplier;
    this.goldMultiplier = this.characterConfig.goldMultiplier;

    // Base stats from balance config
    this.critDamage = GAME_BALANCE.player.baseCritMultiplier;
    this.invincibilityDuration = GAME_BALANCE.player.invincibilityMs;
    this.pickupRange = 50;

    // Health drop chances
    this.healthDropChance = GAME_BALANCE.drops.healthDropChance;
    this.healthDropValue = GAME_BALANCE.drops.healthDropValue;
    this.healthDropLuckMultiplier = GAME_BALANCE.drops.healthDropLuckMultiplier;
  }

  // ============ Health Interface ============

  /**
   * Takes damage with armor reduction and dodge chance
   * @returns true if player died
   */
  public takeDamage(amount: number, currentTime: number): boolean {
    // God mode - no damage
    if (this.godMode) return false;

    // Check invincibility
    if (currentTime < this.invincibleUntil) return false;

    // Note: Dodge is checked in Game.ts before calling this method

    // Armor reduction (diminishing returns)
    const reduction = this.armor / (this.armor + GAME_BALANCE.player.armorDiminishingFactor);
    const finalDamage = amount * (1 - reduction);

    this.hp = Math.max(0, this.hp - finalDamage);
    this.invincibleUntil = currentTime + this.invincibilityDuration;

    return this.hp <= 0;
  }

  /**
   * Heals the player
   */
  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Checks if player is dead
   */
  public isDead(): boolean {
    return this.hp <= 0;
  }

  /**
   * Checks if currently invincible
   */
  public isInvincible(currentTime: number): boolean {
    return currentTime < this.invincibleUntil;
  }

  /**
   * Gets thorns damage
   */
  public getThorns(): number {
    return this.thorns;
  }

  // ============ Movement ============

  /**
   * Updates player state based on input
   * @param input Current input state
   * @param canvasWidth Canvas width for bounds
   * @param canvasHeight Canvas height for bounds
   * @param deltaTime Delta time in seconds
   */
  public updateMovement(
    input: InputState,
    canvasWidth: number,
    canvasHeight: number,
    deltaTime: number,
  ): void {
    // HP regeneration
    if (this.regen > 0) {
      this.regenTimer += deltaTime * 1000;
      if (this.regenTimer >= 1000) {
        this.heal(this.regen);
        this.regenTimer = 0;
      }
    }

    // Calculate velocity from input
    let vx = 0;
    let vy = 0;

    // Prefer analog input if available (gamepad)
    if (input.analogX !== undefined && input.analogY !== undefined) {
      // Analog stick provides normalized direction with magnitude
      vx = input.analogX;
      vy = input.analogY;
    } else {
      // Digital input (keyboard)
      if (input.up) vy = -1;
      if (input.down) vy = 1;
      if (input.left) vx = -1;
      if (input.right) vx = 1;

      // Normalize diagonal movement for digital input
      if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
      }
    }

    // Apply movement
    this.position.x += vx * this.speed;
    this.position.y += vy * this.speed;

    // Keep in bounds
    this.position.x = clamp(this.position.x, this.width / 2, canvasWidth - this.width / 2);
    this.position.y = clamp(this.position.y, this.height / 2, canvasHeight - this.height / 2);

    // Store velocity for external use
    this.setVelocity(vx * this.speed, vy * this.speed);
  }

  /**
   * Base update (called by game loop)
   */
  public update(_deltaTime: number): void {
    // Regeneration timer handled in updateMovement
  }

  // ============ Weapons & Items ============

  /**
   * Adds a weapon type and creates full weapon instance
   * @returns true if added, false if no slots available or weapon already exists
   */
  public addWeapon(type: WeaponType): boolean {
    if (this.weapons.length >= this.maxWeapons) {
      // Check if we already have this weapon - upgrade it
      const existing = this.weapons.find((w) => w.type === type);
      if (existing) {
        existing.level++;
        return true;
      }
      return false;
    }

    const config = WEAPON_TYPES[type];

    // Create full weapon instance
    this.weapons.push({
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
   * Removes a weapon at specified index
   * @returns The removed weapon instance or null if index invalid
   */
  public removeWeaponAt(index: number): WeaponInstance | null {
    if (index < 0 || index >= this.weapons.length) return null;

    const [removed] = this.weapons.splice(index, 1);
    return removed ?? null;
  }

  /**
   * Adds an item
   */
  public addItem(itemId: string): void {
    this.items.push(itemId);
  }

  /**
   * Counts how many of given item player has
   */
  public countItem(itemId: string): number {
    return this.items.filter((i) => i === itemId).length;
  }

  /**
   * Gets weapon position around player
   * @param index Weapon index
   * @param target Optional target for aiming
   */
  public getWeaponPosition(
    index: number,
    target: Vector2 | null = null,
  ): { x: number; y: number; angle: number } {
    const weaponRadius = 25;
    const weaponCount = this.weapons.length || 1;

    const spreadAngle = (TWO_PI / weaponCount) * index;

    const posX = this.position.x + Math.cos(spreadAngle) * weaponRadius;
    const posY = this.position.y + Math.sin(spreadAngle) * weaponRadius;

    let aimAngle = spreadAngle;
    if (target) {
      aimAngle = Math.atan2(target.y - posY, target.x - posX);
    }

    return { x: posX, y: posY, angle: aimAngle };
  }

  /**
   * Sets current target for aiming
   */
  public setTarget(target: Vector2 | null): void {
    this.currentTarget = target;
  }

  // ============ Stats Helpers ============

  /**
   * Applies stat bonuses from item effect
   */
  public applyStat(stat: keyof PlayerStats, value: number): void {
    switch (stat) {
      case 'maxHp':
        this.maxHp += value;
        this.hp += value; // Also increase current HP
        break;
      case 'speed':
        this.speed += value;
        break;
      case 'pickupRange':
        this.pickupRange += value;
        break;
      case 'armor':
        this.armor += value;
        break;
      case 'damageMultiplier':
        this.damageMultiplier += value;
        break;
      case 'attackSpeedMultiplier':
        this.attackSpeedMultiplier += value;
        break;
      case 'critChance':
        this.critChance += value;
        break;
      case 'critDamage':
        this.critDamage += value;
        break;
      case 'lifesteal':
        this.lifesteal += value;
        break;
      case 'knockback':
        this.knockback += value;
        break;
      case 'explosionRadius':
        this.explosionRadius += value;
        break;
      case 'projectileCount':
        this.projectileCount += value;
        break;
      case 'pierce':
        this.pierce += value;
        break;
      case 'attackRange':
        this.attackRange += value;
        break;
      case 'luck':
        this.luck += value;
        break;
      case 'xpMultiplier':
        this.xpMultiplier += value;
        break;
      case 'goldMultiplier':
        this.goldMultiplier += value;
        break;
      case 'dodge':
        this.dodge = Math.min(this.dodge + value, GAME_BALANCE.player.maxDodge);
        break;
      case 'thorns':
        this.thorns += value;
        break;
      case 'regen':
        this.regen += value;
        break;
      case 'maxWeapons':
        this.maxWeapons += value;
        break;
    }
  }
}
