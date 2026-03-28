/**
 * EnemyFactory - Creates enemy entities with scaling applied.
 * Returns raw Koota Entity (no adapter).
 */

import { spawnEnemy } from '@/ecs/factories/entity-factories';
import { Damage, EnemyData, Health } from '@/ecs/traits';
import { EnemyType } from '@/types/enums';
import { Vector2 } from '@/utils';
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { EnemyScalingService } from './EnemyScalingService';

export interface EnemyCreateOptions {
  /** Wave number for stat scaling. If omitted, no wave scaling is applied. */
  waveNumber?: number;
  /** Size/stat scale multiplier (e.g. 0.6 for split enemies). */
  scale?: number;
}

@singleton()
export class EnemyFactory {
  public constructor(private scalingService: EnemyScalingService) {}

  /**
   * Create an enemy entity with optional wave scaling and size scale.
   */
  public create(type: EnemyType, position: Vector2, options?: EnemyCreateOptions): Entity {
    const entity = spawnEnemy({ type, position, scale: options?.scale });

    if (options?.waveNumber !== undefined) {
      this.applyWaveScaling(entity, options.waveNumber);
    }

    return entity;
  }

  /**
   * Apply wave-based stat scaling to an enemy entity.
   */
  private applyWaveScaling(entity: Entity, waveNumber: number): void {
    const multiplier = this.scalingService.getScalingMultiplier(waveNumber);

    const health = entity.get(Health)!;
    const scaledMaxHp = Math.round(health.maxHp * multiplier);
    entity.set(Health, { hp: scaledMaxHp, maxHp: scaledMaxHp });

    const damage = entity.get(Damage)!;
    entity.set(Damage, { amount: Math.round(damage.amount * multiplier) });

    const enemyData = entity.get(EnemyData)!;
    enemyData.bulletDamage = Math.round(enemyData.bulletDamage * multiplier);
    enemyData.explosionDamage = Math.round(enemyData.explosionDamage * multiplier);
  }
}
