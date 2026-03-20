import { WeaponConfig, WeaponInstance, WeaponType } from '@/domain/weapons';
import { spawnDeployable, spawnProjectile } from '@/ecs/factories/entity-factories';
import { PlayerStats, Position, ProjectileData, WeaponInventory } from '@/ecs/traits';
import { addWeapon, getWeaponPosition, removeWeaponAt } from '@/ecs/utils/player-utils';
import type { ProjectileConfig } from '@/entities/Projectile';
import { EventBus } from '@/events';
import { EntityManager } from '@/managers';
import { DeployableType, ProjectileType, VisualEffect } from '@/types';
import type { DeployableConfig } from '@/types/common';
import {
  copyVector,
  degreesToRadians,
  randomChance,
  randomRange,
  vectorFromAngle,
  type Vector2,
} from '@/utils';
import type { Entity } from 'koota';
import toast from 'react-hot-toast';
import { singleton } from 'tsyringe';
import { ConfigService } from '../../config/ConfigService';
import { WeaponStatsCalculator } from './WeaponStatsCalculator';
import { WEAPON_TYPES } from './config';

@singleton()
export class WeaponManager {
  public constructor(
    private entityManager: EntityManager,
    private configService: ConfigService,
    private statsCalculator: WeaponStatsCalculator,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on('weaponSold', ({ weaponIndex }) => {
      const player = this.entityManager.getPlayerEntity();
      const removed = removeWeaponAt(player, weaponIndex);

      if (removed) {
        toast(`💰 Sprzedano ${removed.name}`);
        EventBus.emit('shopPlayerUpdated', undefined);
      }
    });

    EventBus.on('weaponMerge', ({ weaponIndex }) => {
      const player = this.entityManager.getPlayerEntity();
      const inv = player.get(WeaponInventory)!;
      const weapon = inv.weapons[weaponIndex];
      if (!weapon) return;

      const weaponType = weapon.type;
      const success = this.mergeWeapon(weaponIndex);

      if (success) {
        const merged = inv.weapons.find((w) => w.type === weaponType);
        const newLevel = merged?.level ?? 0;
        toast(`🔀 ${merged?.name ?? ''} → Poziom ${newLevel}`);
        EventBus.emit('weaponMerged', { weaponType, newLevel });
        EventBus.emit('shopPlayerUpdated', undefined);
      }
    });
  }

  public fireWeapons(currentTime: number, playerEntity: Entity): void {
    const inv = playerEntity.get(WeaponInventory)!;
    const stats = playerEntity.get(PlayerStats)!;

    for (let i = 0; i < inv.weapons.length; i++) {
      const weapon = inv.weapons[i]!;
      const config = weapon.config;

      // Calculate fire rate with level and player multiplier
      const attackSpeedMultiplier = this.statsCalculator.getAttackSpeedMultiplier(weapon.level);
      const fireRate = config.fireRate / attackSpeedMultiplier / stats.attackSpeedMultiplier;

      // Include fire offset for staggered shooting
      if (currentTime - weapon.lastFireTime < fireRate + weapon.fireOffset) continue;

      // Reset offset after first shot (staggering only applies to initial burst)
      weapon.fireOffset = 0;

      // Handle deployable weapons (mines) - they don't need a target
      if (config.deployableType === DeployableType.MINE) {
        weapon.lastFireTime = currentTime;
        this.deployMine(config, playerEntity, weapon.level);
        continue;
      }

      // Get weapon position (use currentTarget for positioning only)
      const weaponPos = getWeaponPosition(playerEntity, i, stats.currentTarget);
      const maxRange = config.range * stats.attackRange;

      // Find nearest enemy from weapon position within map bounds
      const canvasBounds = this.configService.getCanvasBounds();
      let targetPos = this.entityManager.getNearestEnemyPosition(weaponPos, maxRange, canvasBounds);

      // Fallback to main target if within range
      if (!targetPos && stats.currentTarget) {
        const dx = stats.currentTarget.x - weaponPos.x;
        const dy = stats.currentTarget.y - weaponPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= maxRange) {
          // TODO move canvas bounds to entity manager (do not pass it as parameter, get from config service)
          targetPos = this.entityManager.getNearestEnemyPosition(
            stats.currentTarget,
            50,
            canvasBounds,
          );
        }
      }

      if (!targetPos) continue;

      weapon.lastFireTime = currentTime;

      // Calculate damage with level
      const damageMultiplier = this.statsCalculator.getDamageMultiplier(weapon.level);
      const baseDamage = config.damage * damageMultiplier;

      // Calculate projectile count (bulletCount is base, multishot and projectileCount are bonuses)
      const projectileCount = config.bulletCount + weapon.multishot + stats.projectileCount;

      // Fire based on weapon type - pass target position for correct aiming
      this.fireWeaponProjectiles(
        weapon,
        weaponPos,
        targetPos,
        baseDamage,
        projectileCount,
        playerEntity,
      );
    }
  }

  private fireWeaponProjectiles(
    weapon: WeaponInstance,
    pos: { x: number; y: number; angle: number },
    targetPos: Vector2,
    damage: number,
    projectileCount: number,
    playerEntity: Entity,
  ): void {
    const config = weapon.config;
    const stats = playerEntity.get(PlayerStats)!;
    const playerId = playerEntity.id();

    // Always calculate angle to target
    const targetAngle = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);

    // Critical hit check
    const isCrit = randomChance(stats.critChance);
    const finalDamage = isCrit ? damage * stats.critDamage : damage;

    for (let i = 0; i < projectileCount; i++) {
      // Spread angle for multiple projectiles (spread is in degrees)
      let angle = targetAngle;
      if (projectileCount > 1) {
        const spreadRad = degreesToRadians(config.spread);
        angle = targetAngle - spreadRad / 2 + (spreadRad / (projectileCount - 1)) * i;
      } else if (config.spread > 0) {
        const spreadRad = randomRange(-0.5, 0.5) * degreesToRadians(config.spread);
        angle += spreadRad;
      }

      const speed = config.bulletSpeed;
      const velocityVector = vectorFromAngle(angle, speed);

      const projConfig: ProjectileConfig = {
        position: { x: pos.x, y: pos.y },
        radius: config.bulletRadius ?? 4,
        type: WEAPON_TYPES[weapon.type].projectileType ?? ProjectileType.STANDARD,
        damage: finalDamage,
        ownerId: playerId,
        color: config.color,
        maxDistance: config.shortRange ? (config.maxDistance ?? config.range) : 0,
        pierce: config.pierceCount
          ? { pierceCount: config.pierceCount + stats.pierce, hitEnemies: new Set() }
          : undefined,
        explosive: config.explosive
          ? {
              explosionRadius:
                (config.explosionRadius ?? 50) *
                this.statsCalculator.getExplosionMultiplier(weapon.level) *
                stats.explosionRadius,
              explosionDamage: finalDamage,
              visualEffect: config.explosionEffect ?? VisualEffect.STANDARD,
              weaponLevelDamageMultiplier: this.statsCalculator.getDamageMultiplier(weapon.level),
              weaponLevelExplosionMultiplier: this.statsCalculator.getExplosionMultiplier(
                weapon.level,
              ),
            }
          : undefined,
        weaponCategory: config.weaponCategory,
        explosiveRange: config.explosiveRange,
        bulletSpeed: speed,
        rotationSpeed: config.rotationSpeed,
        friction: config.friction,
        mass: config.projectileMass,
        vx: velocityVector.x,
        vy: velocityVector.y,
      };

      const entity = spawnProjectile(projConfig);

      // Set per-projectile state on ProjectileData (AoS — direct mutation)
      const projectileData = entity.get(ProjectileData)!;
      projectileData.isCrit = isCrit;
    }

    EventBus.emit('weaponFired', { weaponType: weapon.type });
  }

  /**
   * Deploy a mine at the player's position
   */
  private deployMine(config: WeaponConfig, playerEntity: Entity, level: number): void {
    const stats = playerEntity.get(PlayerStats)!;
    const pos = playerEntity.get(Position)!;
    const playerId = playerEntity.id();

    const damageMultiplier = this.statsCalculator.getDamageMultiplier(level);
    const damage = config.damage * damageMultiplier * stats.damageMultiplier;

    const deployableConfig: DeployableConfig = {
      position: copyVector(pos),
      radius: config.bulletRadius ?? 12,
      type: DeployableType.MINE,
      damage: damage,
      ownerId: playerId,
      color: config.color,
      explosionRadius:
        (config.explosionRadius ?? 70) *
        this.statsCalculator.getExplosionMultiplier(level) *
        stats.explosionRadius,
      explosionDamage: damage,
      visualEffect: VisualEffect.STANDARD,
      armingTime: 0.5,
    };

    spawnDeployable(deployableConfig);

    EventBus.emit('weaponFired', { weaponType: WeaponType.MINES });
  }

  public addWeapon(type: WeaponType): void {
    const player = this.entityManager.getPlayerEntity();

    const added = addWeapon(player, type);
    if (!added) return;

    this.recalculateFireOffsets();
  }

  /**
   * Check if a weapon at the given index can be merged with another weapon in inventory.
   */
  public canMergeWeapon(weaponIndex: number): boolean {
    const inv = this.entityManager.getPlayerEntity().get(WeaponInventory)!;
    const weapon = inv.weapons[weaponIndex];
    if (!weapon) return false;

    const maxLevel = this.configService.getWeaponsConfig().maxLevel;
    if (weapon.level >= maxLevel) return false;

    return inv.weapons.some(
      (w, i) => i !== weaponIndex && w.type === weapon.type && w.level === weapon.level,
    );
  }

  /**
   * Find the index of a valid merge partner for the weapon at the given index.
   */
  public getMergePartnerIndex(weaponIndex: number): number {
    const inv = this.entityManager.getPlayerEntity().get(WeaponInventory)!;
    const weapon = inv.weapons[weaponIndex];
    if (!weapon) return -1;

    return inv.weapons.findIndex(
      (w, i) => i !== weaponIndex && w.type === weapon.type && w.level === weapon.level,
    );
  }

  /**
   * Merge two weapons of the same type and level into one weapon of level+1.
   */
  public mergeWeapon(weaponIndex: number): boolean {
    const player = this.entityManager.getPlayerEntity();
    const inv = player.get(WeaponInventory)!;
    const weapon = inv.weapons[weaponIndex];
    if (!weapon) return false;

    if (!this.canMergeWeapon(weaponIndex)) return false;

    const partnerIndex = this.getMergePartnerIndex(weaponIndex);
    if (partnerIndex === -1) return false;

    removeWeaponAt(player, partnerIndex);

    const adjustedIndex = partnerIndex < weaponIndex ? weaponIndex - 1 : weaponIndex;
    const targetWeapon = inv.weapons[adjustedIndex];
    if (!targetWeapon) return false;

    targetWeapon.level++;

    this.recalculateFireOffsets();
    return true;
  }

  public upgradeWeapon(weapon: WeaponInstance): void {
    weapon.level++;
  }

  /**
   * Spread shots evenly for weapons of the same type.
   */
  private recalculateFireOffsets(): void {
    const inv = this.entityManager.getPlayerEntity().get(WeaponInventory)!;

    const weaponsByType: Record<string, WeaponInstance[]> = {};
    for (const weapon of inv.weapons) {
      weaponsByType[weapon.type] ??= [];
      weaponsByType[weapon.type]?.push(weapon);
    }

    for (const type in weaponsByType) {
      const weapons = weaponsByType[type]!;
      const count = weapons.length;
      for (let i = 0; i < count; i++) {
        weapons[i]!.fireOffset = (i / count) * weapons[i]!.config.fireRate;
      }
    }
  }
}
