import { GAME_BALANCE, WEAPON_TYPES } from '@/config';
import { Deployable, DeployableConfig, Projectile, ProjectileConfig } from '@/entities';
import { DeployableType, ProjectileType, VisualEffect } from '@/types/enums';
import { degreesToRadians, randomChance, randomRange } from '@/utils';
import { FireResult, WeaponCategory, WeaponEntityConfig, WeaponType } from './type';

/**
 * Weapon class
 * Creates projectiles or deployables based on weapon type.
 */
export class Weapon {
  /** Weapon type */
  public readonly type: WeaponType;

  /** Weapon name */
  public readonly name: string;

  /** Weapon emoji for UI */
  public readonly emoji: string;

  /** Weapon category */
  public readonly weaponCategory: WeaponCategory;

  /** Base fire rate in milliseconds */
  private baseFireRate: number;

  /** Current fire rate (affected by upgrades) */
  public fireRate: number;

  /** Base damage */
  private baseDamage: number;

  /** Current damage (affected by upgrades) */
  public damage: number;

  /** Bullet speed */
  public bulletSpeed: number;

  /** Number of bullets per shot */
  public bulletCount: number;

  /** Spread angle in degrees */
  public spread: number;

  /** Bullet color */
  public color: string;

  /** Bullet radius */
  public bulletRadius: number;

  /** Attack range */
  public range: number;

  /** Per-weapon knockback multiplier */
  public knockbackMultiplier: number;

  // ============ Special Properties ============

  /** Pierce through enemies */
  public pierce: boolean;
  public pierceCount: number;

  /** Explosive on hit */
  public explosive: boolean;
  public explosionRadius: number;

  /** Short range weapon (flamethrower, sword) */
  public shortRange: boolean;
  public maxDistance: number;

  /** Explosive range for grenades */
  public explosiveRange: number;

  // ============ Projectile/Deployable Types ============

  /** Projectile type to create */
  public projectileType: ProjectileType;

  /** Deployable type (for mines) */
  public deployableType?: DeployableType;

  // ============ State ============

  /** Last fire timestamp */
  private lastFired: number = 0;

  /** Fire offset for staggered shooting */
  public fireOffset: number;

  /** Weapon upgrade level */
  public level: number = 1;

  /** Extra projectiles from items (multishot) */
  public extraProjectiles: number = 0;

  public constructor(entityConfig: WeaponEntityConfig) {
    const config = WEAPON_TYPES[entityConfig.type];
    this.type = entityConfig.type;

    // Basic stats from config
    this.name = config.name;
    this.emoji = config.emoji;
    this.weaponCategory = config.weaponCategory;
    this.baseFireRate = config.fireRate;
    this.fireRate = config.fireRate;
    this.baseDamage = config.damage;
    this.damage = config.damage;
    this.bulletSpeed = config.bulletSpeed;
    this.bulletCount = config.bulletCount;
    this.spread = config.spread;
    this.color = config.color;
    this.bulletRadius = config.bulletRadius ?? 4;
    this.range = config.range;
    this.knockbackMultiplier = config.knockbackMultiplier ?? 1;

    // Special properties
    this.pierce = config.pierce ?? false;
    this.pierceCount = config.pierceCount ?? (config.pierce ? 999 : 0);
    this.explosive = config.explosive ?? false;
    this.explosionRadius = config.explosionRadius ?? 0;
    this.shortRange = config.shortRange ?? false;
    this.maxDistance = config.maxDistance ?? Infinity;
    this.explosiveRange = config.explosiveRange ?? 0;

    // Type mappings
    this.projectileType = config.projectileType ?? ProjectileType.STANDARD;
    this.deployableType = config.deployableType;

    // State
    this.fireOffset = entityConfig.fireOffset ?? 0;
  }

  /**
   * Check if weapon can fire
   */
  public canFire(currentTime: number): boolean {
    return currentTime - this.lastFired >= this.fireRate + this.fireOffset;
  }

  /**
   * Reset fire offset after first shot
   */
  public resetOffset(): void {
    this.fireOffset = 0;
  }

  /**
   * Upgrade weapon stats
   */
  public upgrade(): void {
    this.level++;
    const upgradeConfig = GAME_BALANCE.weapons.upgrade;

    // Increase damage
    this.damage = this.baseDamage * (1 + (this.level - 1) * (upgradeConfig.damagePerLevel - 1));

    // Decrease fire rate (faster shooting)
    this.fireRate = Math.round(this.baseFireRate / upgradeConfig.attackSpeedPerLevel);

    // Increase explosion radius
    if (this.explosive) {
      this.explosionRadius *= upgradeConfig.explosionPerLevel;
    }
  }

  /**
   * Fire weapon and create projectiles/deployables
   */
  public fire(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    currentTime: number,
    ownerId: number,
    options: {
      damageMultiplier?: number;
      attackSpeedMultiplier?: number;
      critChance?: number;
      critDamage?: number;
      extraProjectiles?: number;
      extraPierce?: number;
      explosionRadiusMultiplier?: number;
    } = {},
  ): FireResult {
    const result: FireResult = {
      projectiles: [],
      deployables: [],
    };

    if (!this.canFire(currentTime)) {
      return result;
    }

    const {
      damageMultiplier = 1,
      attackSpeedMultiplier = 1,
      critChance = 0,
      critDamage = GAME_BALANCE.player.baseCritMultiplier,
      extraProjectiles = 0,
      extraPierce = 0,
      explosionRadiusMultiplier = 1,
    } = options;

    // Calculate effective fire rate
    const effectiveFireRate = this.fireRate / attackSpeedMultiplier;
    this.lastFired = currentTime - (this.fireRate - effectiveFireRate);

    // Reset stagger offset after first shot
    this.fireOffset = 0;

    // Handle deployables (mines)
    if (this.deployableType === DeployableType.MINE) {
      const deployable = this.createDeployable(
        x,
        y,
        ownerId,
        damageMultiplier,
        explosionRadiusMultiplier,
      );
      result.deployables.push(deployable);
      return result;
    }

    // Create projectiles
    const baseAngle = Math.atan2(targetY - y, targetX - x);
    const totalBullets = this.bulletCount + extraProjectiles + this.extraProjectiles;

    for (let i = 0; i < totalBullets; i++) {
      let angle = baseAngle;

      if (totalBullets > 1) {
        // Spread bullets evenly
        const spreadRad = (this.spread * Math.PI) / 180;
        angle = baseAngle - spreadRad / 2 + (spreadRad / (totalBullets - 1)) * i;
      } else if (this.spread > 0) {
        // Random spread for single bullet
        const spreadRad = randomRange(-0.5, 0.5) * degreesToRadians(this.spread);
        angle += spreadRad;
      }

      // Critical hit check
      let finalDamage = this.damage * damageMultiplier;
      let isCrit = false;
      if (randomChance(critChance)) {
        finalDamage *= critDamage;
        isCrit = true;
      }

      const projectile = this.createProjectile(
        x,
        y,
        angle,
        ownerId,
        finalDamage,
        isCrit,
        extraPierce,
        explosionRadiusMultiplier,
      );

      result.projectiles.push(projectile);
    }

    return result;
  }

  /**
   * Create a projectile with this weapon's settings
   */
  private createProjectile(
    x: number,
    y: number,
    angle: number,
    ownerId: number,
    damage: number,
    isCrit: boolean,
    extraPierce: number,
    explosionRadiusMultiplier: number,
  ): Projectile {
    const config: ProjectileConfig = {
      position: { x, y },
      vx: Math.cos(angle) * this.bulletSpeed,
      vy: Math.sin(angle) * this.bulletSpeed,
      radius: this.bulletRadius,
      type: this.projectileType,
      damage,
      ownerId,
      color: this.color,
      maxDistance: this.shortRange ? this.maxDistance : 0,
    };

    // Explosive component
    if (this.explosive) {
      config.explosive = {
        explosionRadius: this.explosionRadius * explosionRadiusMultiplier,
        explosionDamage: damage,
        visualEffect: this.getVisualEffect(),
      };
    }

    // Pierce component
    if (this.pierce || extraPierce > 0) {
      config.pierce = {
        pierceCount: this.pierceCount + extraPierce,
        hitEnemies: new Set(),
      };
    }

    // Rotation for scythe
    if (this.projectileType === ProjectileType.SCYTHE) {
      config.rotationSpeed = 10; // radians per second
    }

    const projectile = new Projectile(config);

    // Store additional metadata
    projectile.isCrit = isCrit;
    projectile.knockbackMultiplier = this.knockbackMultiplier;
    projectile.weaponCategory = this.weaponCategory;
    projectile.explosiveRange = this.explosiveRange;

    return projectile;
  }

  /**
   * Create a deployable (mine) with this weapon's settings
   */
  private createDeployable(
    x: number,
    y: number,
    ownerId: number,
    damageMultiplier: number,
    explosionRadiusMultiplier: number,
  ): Deployable {
    const config: DeployableConfig = {
      position: {
        x,
        y,
      },
      radius: this.bulletRadius,
      type: DeployableType.MINE,
      damage: this.damage * damageMultiplier,
      ownerId,
      color: this.color,
      explosionRadius: this.explosionRadius * explosionRadiusMultiplier,
      explosionDamage: this.damage * damageMultiplier,
      visualEffect: VisualEffect.STANDARD,
      armingTime: 0.5, // 500ms
    };

    return new Deployable(config);
  }

  // TODO, visual effect should be tied to projectile type?
  /**
   * Get visual effect type based on weapon
   */
  private getVisualEffect(): VisualEffect {
    switch (this.projectileType) {
      case ProjectileType.NUKE:
        return VisualEffect.NUKE;
      case ProjectileType.HOLY_GRENADE:
        return VisualEffect.HOLY;
      case ProjectileType.BANANA:
      case ProjectileType.MINI_BANANA:
        return VisualEffect.BANANA;
      default:
        return VisualEffect.STANDARD;
    }
  }
}
