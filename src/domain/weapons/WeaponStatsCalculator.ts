/**
 * Service for calculating upgraded weapon statistics
 * Uses ConfigService for balance values - single source of truth
 */

import { ConfigService } from '@/config/ConfigService';
import { WeaponConfig } from '@/domain/weapons/type';
import { singleton } from 'tsyringe';

export interface UpgradedWeaponStats {
  damage: number;
  fireRate: number;
  explosionRadius?: number;
  bulletCount: number;
}

@singleton()
export class WeaponStatsCalculator {
  public constructor(private configService: ConfigService) {}

  /**
   * Calculate weapon stats after applying upgrade multipliers
   * @param config - Base weapon configuration
   * @param level - Current weapon level (1 = base level, 2+ = upgraded)
   * @returns Calculated stats with level multipliers applied
   */
  public calculate(config: WeaponConfig, level: number): UpgradedWeaponStats {
    const damage = config.damage * this.getDamageMultiplier(level);
    const fireRate = config.fireRate / this.getAttackSpeedMultiplier(level);

    let explosionRadius: number | undefined;
    if (config.explosive && config.explosionRadius) {
      explosionRadius = config.explosionRadius * this.getExplosionMultiplier(level);
    }

    return {
      damage: Math.round(damage),
      fireRate: Math.round(fireRate),
      explosionRadius: explosionRadius ? Math.round(explosionRadius) : undefined,
      bulletCount: config.bulletCount,
    };
  }

  /**
   * Get damage multiplier for a given level
   */
  public getDamageMultiplier(level: number): number {
    return Math.pow(this.configService.getWeaponsUpgrade().damagePerLevel, level - 1);
  }

  /**
   * Get attack speed multiplier for a given level
   */
  public getAttackSpeedMultiplier(level: number): number {
    return Math.pow(this.configService.getWeaponsUpgrade().attackSpeedPerLevel, level - 1);
  }

  /**
   * Get explosion radius multiplier for a given level
   */
  public getExplosionMultiplier(level: number): number {
    return Math.pow(this.configService.getWeaponsUpgrade().explosionPerLevel, level - 1);
  }
}
