/**
 * ShockwaveSystem — manages shockwave ECS entity lifecycle.
 * Syncs shockwave position to owner enemy, expands radius, fades alpha, marks dead.
 */

import { ConfigService } from '@/config/ConfigService';
import { IsDead, Position, ShockwaveData } from '@/ecs/traits';
import { world } from '@/ecs/world';
import { EntityManager } from '@/managers/EntityManager';
import { singleton } from 'tsyringe';

@singleton()
export class ShockwaveSystem {
  private readonly duration: number;
  private readonly expansionFactor: number;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    const cfg = configService.getEffectsConfig().shockwaves;
    this.duration = cfg.duration;
    this.expansionFactor = cfg.expansionFactor;
  }

  public update(currentTime: number): void {
    for (const entity of this.entityManager.getActiveShockwaves()) {
      const sd = entity.get(ShockwaveData)!;

      // Follow owner position if alive
      const owner = sd.ownerEntity;
      if (owner && world.has(owner) && !owner.has(IsDead)) {
        const ownerPos = owner.get(Position)!;
        entity.set(Position, ownerPos);
      }

      // Expand ring and fade
      const age = currentTime - sd.created;
      sd.currentRadius = sd.maxRadius * Math.min(1, age / (this.duration * this.expansionFactor));
      sd.alpha = 1 - age / this.duration;

      if (sd.alpha <= 0) {
        entity.add(IsDead);
      }
    }
  }
}
