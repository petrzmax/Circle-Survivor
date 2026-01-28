import { GAME_BALANCE, GameBalanceConfig } from '@/config';
import { singleton } from 'tsyringe';
import { CanvasBounds } from './../utils/random';

@singleton()
export class ConfigService {
  public getCanvasBounds(): CanvasBounds {
    return { width: 900, height: 700 };
  }

  public getGameBalance(): GameBalanceConfig {
    return GAME_BALANCE;
  }
}
