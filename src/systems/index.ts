/**
 * Systems module exports
 */

export { CollisionSystem } from './CollisionSystem';
export type { CollisionResult, CollisionSystemConfig } from './CollisionSystem';

export { CombatSystem } from './CombatSystem';
export type { CombatSystemConfig, ExplosionEvent } from './CombatSystem';

export { AudioSystem } from './AudioSystem';

export { InputHandler } from './InputHandler';
export type { InputHandlerCallbacks, KeyState } from './InputHandler';

export { createEffectsState, EffectsSystem } from './EffectsSystem';
export type { DeathParticle, EffectsState, Explosion, Shockwave } from './EffectsSystem';

export { HUD } from './HUD';
export type { HUDBoss, HUDPlayer, HUDWaveManager } from './HUD';

export { WeaponRenderer } from '../rendering/WeaponRenderer';
export type {
  RenderedWeapon,
  WeaponPosition,
  WeaponRenderPlayer,
} from '../rendering/WeaponRenderer';

export { WaveManager } from './WaveManager';
export type { WaveUpdateResult } from './WaveManager';
