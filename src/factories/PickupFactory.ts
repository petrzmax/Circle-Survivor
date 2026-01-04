import { Pickup } from '@/entities';
import { PickupType } from '@/types';
import { Vector2 } from '@/utils';

export function createGoldPickup(position: Vector2, value: number): Pickup {
  return new Pickup({
    position,
    type: PickupType.GOLD,
    value,
  });
}

export function createHealthPickup(position: Vector2, value: number): Pickup {
  return new Pickup({
    position,
    type: PickupType.HEALTH,
    value,
  });
}
