/**
 * EnemyFactory - Creates enemy entities with scaling applied.
 * Returns raw Koota Entity (no adapter).
 */

import type { Entity } from 'koota';
import { ENEMY_TYPES } from '@/domain/enemies/config';
import { Damage, Health } from '@/ecs/traits';
import { spawnEnemy } from '@/ecs/factories/entity-factories';
import { EnemyType } from '@/types/enums';
import { Vector2 } from '@/utils';
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
      this.applyWaveScaling(entity, type, options.waveNumber);
    }

    return entity;
  }

  /**
   * Apply wave-based stat scaling to an enemy entity.
   */
  private applyWaveScaling(entity: Entity, type: EnemyType, waveNumber: number): void {
    const config = ENEMY_TYPES[type];
    const scaling = config.isBoss
      ? this.scalingService.getBossScaling(waveNumber)
      : this.scalingService.getEnemyScaling(waveNumber);

    const health = entity.get(Health)!;
    const scaledMaxHp = Math.round(health.maxHp * scaling.hpMultiplier);
    entity.set(Health, { hp: scaledMaxHp, maxHp: scaledMaxHp });

    const damage = entity.get(Damage)!;
    entity.set(Damage, { amount: Math.round(damage.amount * scaling.dmgMultiplier) });
  }
}
