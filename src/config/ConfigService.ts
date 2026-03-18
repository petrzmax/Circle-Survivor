import { GAME_BALANCE, GameBalanceConfig, WeaponUpgradeConfig } from '@/config/balance.config';
import { EFFECTS_CONFIG, EffectsConfig } from '@/config/effects.config';
import { singleton } from 'tsyringe';
import { CanvasBounds } from '@/types/common';

@singleton()
export class ConfigService {
  public getCanvasBounds(): CanvasBounds {
    return { width: 900, height: 700 };
  }

  public getGameBalance(): GameBalanceConfig {
    return GAME_BALANCE;
  }

  public getBossBalance(): GameBalanceConfig['boss'] {
    return GAME_BALANCE.boss;
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
}
