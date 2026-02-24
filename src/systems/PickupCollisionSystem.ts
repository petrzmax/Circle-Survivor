import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { Pickup } from '@/entities/Pickup';

@singleton()
export class PickupCollisionSystem {
  /**
   * Process pickup collisions from CollisionResult.
   */
  public processPickups(pickups: Pickup[]): void {
    for (const pickup of pickups) {
      this.processPickupCollection(pickup);
    }
  }

  private processPickupCollection(pickup: Pickup): void {
    const amount = pickup.collect();

    EventBus.emit('pickupCollected', {
      type: pickup.type,
      amount,
      position: pickup.position,
    });
  }
}
