/**
 * EnemyFactory - Creates Enemy instances with scaling applied.
 */

import { ENEMY_TYPES } from '@/domain/enemies/config';
import { Enemy } from '@/domain/enemies/Enemy';
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
   * Create an enemy with optional wave scaling and size scale.
   */
  public create(type: EnemyType, position: Vector2, options?: EnemyCreateOptions): Enemy {
    const enemy = new Enemy({
      position,
      type,
      scale: options?.scale,
    });

    if (options?.waveNumber !== undefined) {
      this.applyWaveScaling(enemy, type, options.waveNumber);
    }

    return enemy;
  }

  /**
   * Apply wave-based stat scaling to an enemy.
   */
  private applyWaveScaling(enemy: Enemy, type: EnemyType, waveNumber: number): void {
    const config = ENEMY_TYPES[type];
    const scaling = config.isBoss
      ? this.scalingService.getBossScaling(waveNumber)
      : this.scalingService.getEnemyScaling(waveNumber);

    enemy.maxHp = Math.round(enemy.maxHp * scaling.hpMultiplier);
    enemy.hp = enemy.maxHp;
    enemy.damage = Math.round(enemy.damage * scaling.dmgMultiplier);
  }
}
