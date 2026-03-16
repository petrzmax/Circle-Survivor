import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { IsDead, PickupData, Position } from '@/ecs/traits';
import type { Entity } from 'koota';

@singleton()
export class PickupCollisionSystem {
  /**
   * Process pickup collisions from CollisionResult.
   */
  public processPickups(pickups: Entity[]): void {
    for (const pickup of pickups) {
      this.processPickupCollection(pickup);
    }
  }

  private processPickupCollection(pickup: Entity): void {
    const data = pickup.get(PickupData)!;
    const pos = pickup.get(Position)!;
    const amount = data.value;

    // Mark as collected (IsDead is the universal "pending removal" tag)
    if (!pickup.has(IsDead)) pickup.add(IsDead);

    EventBus.emit('pickupCollected', {
      type: data.type,
      amount,
      position: pos,
    });
  }
}
