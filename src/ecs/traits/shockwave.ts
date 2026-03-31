/**
 * Shockwave-specific ECS trait — AoS callback-based for complex data.
 */

import type { Entity } from 'koota';
import { trait } from 'koota';

/** Shockwave-specific data (expanding ring from enemy attacks) */
export const ShockwaveData = trait(() => ({
  /** The enemy entity that created this shockwave (null if source unknown) */
  ownerEntity: null as Entity | null,
  maxRadius: 0,
  currentRadius: 0,
  color: '',
  /** Creation timestamp in ms (for age-based animation) */
  created: 0,
  damageDealt: false,
  alpha: 1,
  /** Entities already knocked back by this shockwave (prevents repeated knockback) */
  knockedBackEntities: new Set<number>(),
}));
