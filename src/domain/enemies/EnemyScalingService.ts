/**
 * EnemyScalingService - Calculates stat multipliers for enemies based on wave number.
 */

import { ConfigService } from '@/config/ConfigService';
import { singleton } from 'tsyringe';

@singleton()
export class EnemyScalingService {
  public constructor(private configService: ConfigService) {}

  /**
   * Get scaling multiplier for any enemy based on wave number.
   * Wave 1 = base stats (1.0), each subsequent wave scales by scalingFactor.
   */
  public getScalingMultiplier(waveNumber: number): number {
    const { scalingFactor } = this.configService.getEnemyBalance();
    return Math.pow(scalingFactor, waveNumber - 1);
  }
}
