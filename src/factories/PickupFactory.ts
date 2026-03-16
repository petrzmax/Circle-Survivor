import type { Entity } from 'koota';
import { spawnPickup } from '@/ecs/factories/entity-factories';
import { PickupType } from '@/types';
import { Vector2 } from '@/utils';

export function createGoldPickup(position: Vector2, value: number): Entity {
  return spawnPickup({
    position,
    type: PickupType.GOLD,
    value,
  });
}

export function createHealthPickup(position: Vector2, value: number): Entity {
  return spawnPickup({
    position,
    type: PickupType.HEALTH,
    value,
  });
}
