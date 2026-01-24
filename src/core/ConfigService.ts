import { singleton } from 'tsyringe';
import { CanvasBounds } from './../utils/random';

@singleton()
export class ConfigService {
  public getCanvasBounds(): CanvasBounds {
    return { width: 900, height: 700 };
  }
}
