/**
 * EnemyScalingService - Calculates stat multipliers for enemies based on wave number.
 */

import { ConfigService } from '@/config/ConfigService';
import { singleton } from 'tsyringe';

export interface EnemyScaling {
  hpMultiplier: number;
  dmgMultiplier: number;
}

@singleton()
export class EnemyScalingService {
  public constructor(private configService: ConfigService) {}

  /**
   * Get scaling multipliers for regular enemies based on wave number.
   */
  public getEnemyScaling(waveNumber: number): EnemyScaling {
    const { scalingStartWave, scalingFactor } = this.configService.getEnemyBalance();

    if (waveNumber < scalingStartWave) {
      return { hpMultiplier: 1, dmgMultiplier: 1 };
    }

    const scalingWave = waveNumber - scalingStartWave;
    const multiplier = Math.pow(scalingFactor, scalingWave);

    return { hpMultiplier: multiplier, dmgMultiplier: multiplier };
  }

  /**
   * Get scaling multipliers for boss enemies based on wave number.
   * Combines linear per-boss-wave scaling with exponential scaling.
   */
  public getBossScaling(waveNumber: number): EnemyScaling {
    const { hpScalePerWave, dmgScalePerWave, exponentialBase } =
      this.configService.getBossBalance();

    const bossWave = Math.floor(waveNumber / 3);

    // Linear scaling per boss appearance
    const hpLinear = 1 + (bossWave - 1) * hpScalePerWave;
    const dmgLinear = 1 + (bossWave - 1) * dmgScalePerWave;

    // Exponential scaling from wave 3+
    let expMultiplier = 1;
    if (waveNumber >= 3) {
      const scalingWave = waveNumber - 3;
      expMultiplier = Math.pow(exponentialBase, scalingWave);
    }

    return {
      hpMultiplier: hpLinear * expMultiplier,
      dmgMultiplier: dmgLinear * expMultiplier,
    };
  }
}
