import { EntityManager } from '@/managers/EntityManager';
import { singleton } from 'tsyringe';

@singleton()
export class PickupSystem {
  public constructor(private entityManager: EntityManager) {}

  /**
   * Update all pickups and deployables (lifetime, animation).
   */
  public update(deltaTime: number): void {
    // Update deployables (mines) - movement/animation
    const deployables = this.entityManager.getActiveDeployables();
    for (const deployable of deployables) {
      deployable.update(deltaTime);
    }

    // Update pickups (lifetime, animation)
    const pickups = this.entityManager.getActivePickups();
    for (const pickup of pickups) {
      pickup.update(deltaTime);
    }
  }
}
