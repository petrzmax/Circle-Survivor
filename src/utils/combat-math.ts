import { singleton } from 'tsyringe';
import { ConfigService } from '@/config/ConfigService';

@singleton()
export class CombatMath {
  private readonly armorFactor: number;
  private readonly falloffRate: number;

  public constructor(configService: ConfigService) {
    this.armorFactor = configService.getPlayerBalance().armorDiminishingFactor;
    this.falloffRate = configService.getCombatConfig().explosionFalloff;
  }

  /**
   * Armor diminishing returns reduction.
   * Formula: armor / (armor + factor)
   *
   * @returns Damage reduction ratio [0..1)
   */
  public armorReduction(armor: number): number {
    return armor / (armor + this.armorFactor);
  }

  /**
   * Explosion distance falloff multiplier.
   * Damage decreases linearly from center (full damage) to edge (falloff damage).
   *
   * @param dist         Distance from explosion center to target
   * @param radius       Explosion radius
   * @returns Damage multiplier [falloffRate..1]
   */
  public explosionFalloff(dist: number, radius: number): number {
    return 1 - (1 - this.falloffRate) * (dist / radius);
  }
}

/**
 * Heal an entity, clamped to maxHp.
 */
export function healEntity(target: { hp: number; maxHp: number }, amount: number): void {
  target.hp = Math.min(target.maxHp, target.hp + amount);
}
