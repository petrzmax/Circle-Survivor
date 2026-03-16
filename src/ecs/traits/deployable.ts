/**
 * Deployable-specific ECS trait — AoS callback-based for complex data.
 */

import { trait } from 'koota';
import { DeployableType } from '@/types/enums';
import { VisualEffect } from '@/types/enums';

/** Deployable-specific data */
export const DeployableData = trait(() => ({
  type: DeployableType.MINE,
  ownerId: -1,
  color: '#333333',
  triggerRadius: 0,
  armingTime: 0.5,
  animationTime: 0,
  blinkOffset: 0,
  visualEffect: VisualEffect.STANDARD,
}));
