/**
 * Koota ECS World singleton.
 * Central state container for all ECS entities and traits.
 */

import { createWorld, trait } from 'koota';

/** Global time resource — updated each frame in Game.ts */
export const Time = trait({ delta: 0, elapsed: 0, current: 0 });

// Only EntityManager and entity factories should import world directly.
/** Single Koota world instance for the entire game */
export const world = createWorld();

// Add Time as a world-level trait (global resource)
world.add(Time);
