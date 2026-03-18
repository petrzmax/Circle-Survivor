/**
 * Pickup-specific ECS trait — AoS callback-based for complex data.
 */

import { trait } from 'koota';
import { PickupType } from '@/types/enums';

/** Pickup-specific data */
export const PickupData = trait(() => ({
  type: PickupType.GOLD,
  value: 0,
  animationOffset: 0,
  shrinkDuration: 1,
  spawnTime: 0,
  attractionStartTime: 0,
}));
