import { GAME_BALANCE, GameBalanceConfig, WeaponUpgradeConfig } from '@/config/balance.config';
import { EFFECTS_CONFIG, EffectsConfig } from '@/config/effects.config';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/config/layout.config';
import { singleton } from 'tsyringe';
import { CanvasBounds } from '@/types/common';

@singleton()
export class ConfigService {
  public getCanvasBounds(): CanvasBounds {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  public getGameBalance(): GameBalanceConfig {
    return GAME_BALANCE;
  }

  public getEnemyBalance(): GameBalanceConfig['enemy'] {
    return GAME_BALANCE.enemy;
  }

  public getPlayerBalance(): GameBalanceConfig['player'] {
    return GAME_BALANCE.player;
  }

  public getWeaponsConfig(): GameBalanceConfig['weapons'] {
    return GAME_BALANCE.weapons;
  }

  public getWeaponsUpgrade(): WeaponUpgradeConfig {
    return GAME_BALANCE.weapons.upgrade;
  }

  public getEffectsConfig(): EffectsConfig {
    return EFFECTS_CONFIG;
  }

  public getPickupConfig(): GameBalanceConfig['pickup'] {
    return GAME_BALANCE.pickup;
  }

  public getCombatConfig(): GameBalanceConfig['combat'] {
    return GAME_BALANCE.combat;
  }

  public getPhysicsConfig(): GameBalanceConfig['physics'] {
    return GAME_BALANCE.physics;
  }
}
