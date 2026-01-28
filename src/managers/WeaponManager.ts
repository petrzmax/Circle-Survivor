import { Enemy } from '@/domain/enemies';
import { WeaponConfig, WeaponInstance, WeaponType } from '@/domain/weapons';
import { Deployable, DeployableConfig, Player, Projectile } from '@/entities';
import { EventBus } from '@/events';
import { EntityManager } from '@/managers';
import { DeployableType, ProjectileType, VisualEffect } from '@/types';
import { copyVector, degreesToRadians, randomChance, randomRange, vectorFromAngle } from '@/utils';
import { singleton } from 'tsyringe';
import { ConfigService } from './../core/ConfigService';
import { WEAPON_TYPES } from './../domain/weapons/config';

@singleton()
export class WeaponManager {
  public constructor(
    private entityManager: EntityManager,
    private configService: ConfigService,
  ) {}

  public fireWeapons(currentTime: number, player: Player): void {
    // TODO it shouldn't know so deep object definition. add specific method for it.
    const upgradeConfig = this.configService.getGameBalance().weapons.upgrade;

    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i]!;
      const config = weapon.config;

      // Calculate fire rate with level and player multiplier
      const attackSpeedMultiplier = Math.pow(upgradeConfig.attackSpeedPerLevel, weapon.level - 1);
      const fireRate = config.fireRate / attackSpeedMultiplier / player.attackSpeedMultiplier;

      // Include fire offset for staggered shooting
      if (currentTime - weapon.lastFireTime < fireRate + weapon.fireOffset) continue;

      // Reset offset after first shot (staggering only applies to initial burst)
      weapon.fireOffset = 0;

      // Handle deployable weapons (mines) - they don't need a target
      if (config.deployableType === DeployableType.MINE) {
        weapon.lastFireTime = currentTime;
        this.deployMine(config, player, weapon.level);
        continue;
      }

      // Get weapon position (use currentTarget for positioning only)
      const weaponPos = player.getWeaponPosition(i, player.currentTarget);
      const maxRange = config.range * player.attackRange;

      // Find nearest enemy from weapon position within map bounds
      const canvasBounds = this.configService.getCanvasBounds();
      let target = this.entityManager.getNearestEnemy(weaponPos, maxRange, canvasBounds);

      // Fallback to main target if within range
      if (!target && player.currentTarget) {
        const dx = player.currentTarget.x - weaponPos.x;
        const dy = player.currentTarget.y - weaponPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= maxRange) {
          // Find the actual enemy at currentTarget position within map bounds
          target = this.entityManager.getNearestEnemy(player.currentTarget, 50, canvasBounds);
        }
      }

      if (!target) continue;

      weapon.lastFireTime = currentTime;

      // Calculate damage with level
      const damageMultiplier = Math.pow(upgradeConfig.damagePerLevel, weapon.level - 1);
      const baseDamage = config.damage * damageMultiplier;

      // Calculate projectile count (bulletCount is base, multishot and projectileCount are bonuses)
      const projectileCount = config.bulletCount + weapon.multishot + player.projectileCount;

      // Fire based on weapon type - pass target position for correct aiming
      this.fireWeaponProjectiles(
        weapon,
        weaponPos,
        target,
        baseDamage,
        projectileCount,
        player,
        upgradeConfig,
      );
    }
  }

  private fireWeaponProjectiles(
    weapon: WeaponInstance,
    pos: { x: number; y: number; angle: number },
    target: Enemy,
    damage: number,
    projectileCount: number,
    player: Player,
    upgradeConfig: {
      damagePerLevel: number;
      attackSpeedPerLevel: number;
      explosionPerLevel: number;
    },
  ): void {
    const config = weapon.config;
    // Always calculate angle to target - not using pos.angle fallback
    const targetAngle = Math.atan2(target.position.y - pos.y, target.position.x - pos.x);

    // Critical hit check
    const isCrit = randomChance(player.critChance);
    const finalDamage = isCrit ? damage * player.critDamage : damage;

    for (let i = 0; i < projectileCount; i++) {
      // Spread angle for multiple projectiles (spread is in degrees)
      let angle = targetAngle;
      if (projectileCount > 1) {
        const spreadRad = degreesToRadians(config.spread);
        // Distribute bullets evenly across spread
        angle = targetAngle - spreadRad / 2 + (spreadRad / (projectileCount - 1)) * i;
      } else if (config.spread > 0) {
        // Random spread for single bullet
        const spreadRad = randomRange(-0.5, 0.5) * degreesToRadians(config.spread);
        angle += spreadRad;
      }

      const speed = config.bulletSpeed;
      const velocityVector = vectorFromAngle(angle, speed);

      const projectile = new Projectile({
        position: { x: pos.x, y: pos.y },
        radius: config.bulletRadius ?? 4, // Default 4 like original
        type: WEAPON_TYPES[weapon.type].projectileType ?? ProjectileType.STANDARD,
        damage: finalDamage,
        ownerId: player.id,
        color: config.color,
        maxDistance: config.shortRange ? (config.maxDistance ?? config.range) : 0, // 0 = infinite
        pierce: config.pierce
          ? { pierceCount: (config.pierceCount ?? 1) + player.pierce, hitEnemies: new Set() }
          : undefined,
        explosive: config.explosive
          ? {
              explosionRadius:
                (config.explosionRadius ?? 50) *
                Math.pow(upgradeConfig.explosionPerLevel, weapon.level - 1) *
                player.explosionRadius,
              explosionDamage: finalDamage,
              visualEffect: config.explosionEffect ?? VisualEffect.STANDARD,
            }
          : undefined,
        // Grenade properties for slowdown/explosion behavior
        weaponCategory: config.weaponCategory,
        explosiveRange: config.explosiveRange,
        bulletSpeed: speed,
        // Projectile rotation (e.g., scythe)
        rotationSpeed: config.rotationSpeed,
      });

      projectile.setVelocityVector(velocityVector);
      projectile.isCrit = isCrit;
      projectile.knockbackMultiplier = config.knockbackMultiplier ?? 1;

      this.entityManager.addProjectile(projectile);
    }

    // Play weapon sound
    EventBus.emit('weaponFired', { weaponType: weapon.type });
  }

  /**
   * Deploy a mine at the player's position
   */
  private deployMine(config: WeaponConfig, player: Player, level: number): void {
    const upgradeConfig = this.configService.getGameBalance().weapons.upgrade;

    // Calculate damage with level
    const damageMultiplier = Math.pow(upgradeConfig.damagePerLevel, level - 1);
    const damage = config.damage * damageMultiplier * player.damageMultiplier;

    // Create deployable config
    const deployableConfig: DeployableConfig = {
      position: copyVector(player.position), // Copy position so mine doesn't follow player
      radius: config.bulletRadius ?? 12,
      type: DeployableType.MINE,
      damage: damage,
      ownerId: player.id,
      color: config.color,
      explosionRadius:
        (config.explosionRadius ?? 70) *
        Math.pow(upgradeConfig.explosionPerLevel, level - 1) *
        player.explosionRadius,
      explosionDamage: damage,
      visualEffect: VisualEffect.STANDARD,
      armingTime: 0.5, // 500ms arming time
    };

    const mine = new Deployable(deployableConfig);
    this.entityManager.addDeployable(mine);

    // Play mine deploy sound
    EventBus.emit('weaponFired', { weaponType: WeaponType.MINES });
  }

  public addWeapon(type: WeaponType): void {
    const player = this.entityManager.getPlayer();

    // Let player handle weapon creation and management
    const added = player.addWeapon(type);
    if (!added) return;

    // Recalculate fire offsets for staggered shooting
    this.recalculateFireOffsets();
  }

  /**
   * Upgrade weapon stats
   */
  public upgradeWeapon(weapon: WeaponInstance): void {
    weapon.level++;
  }

  /**
   * Spread shots evenly for weapons of the same type.
   * Assigns staggered offsets so weapons don't all fire at once.
   */
  private recalculateFireOffsets(): void {
    const player = this.entityManager.getPlayer();

    // Group weapons by type
    const weaponsByType: Record<string, WeaponInstance[]> = {};
    for (const weapon of player.weapons) {
      weaponsByType[weapon.type] ??= [];
      weaponsByType[weapon.type]?.push(weapon);
    }

    // Assign staggered offsets within each type group
    for (const type in weaponsByType) {
      const weapons = weaponsByType[type]!;
      const count = weapons.length;
      for (let i = 0; i < count; i++) {
        // Offset each weapon by fraction of fire rate
        weapons[i]!.fireOffset = (i / count) * weapons[i]!.config.fireRate;
      }
    }
  }
}
