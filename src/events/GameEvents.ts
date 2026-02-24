import { Enemy } from '@/domain/enemies';
import { AttackPattern, ShockwaveAttackResult } from '@/domain/enemies/type';
import { WeaponType } from '@/domain/weapons';
import { Pickup, Player, Projectile } from '@/entities';
import { DamageSource, ExplosionEvent, KillSource } from '@/systems/damage.types';
import { CharacterType, GameState, PickupType } from '@/types';
import { Vector2 } from '@/utils';

/**
 * Event payload types for type-safe event handling
 */
export interface GameEvents {
  // Combat events
  enemyDeath: { enemy: Enemy; killer: KillSource };
  /** Unified damage event emitted by DamageSystem for any entity */
  entityDamaged: {
    entityId: number;
    damage: number;
    source: Vector2;
    damageSource: DamageSource;
    isPlayer: boolean;
  };
  playerDeath: { player: Player; killedBy: Enemy | null };
  playerDodged: void;
  thornsTriggered: void;

  // Explosion queue event — any system can emit to queue an explosion
  queueExplosion: ExplosionEvent;

  // Weapon events
  weaponFired: { weaponType: WeaponType };

  // Projectile events
  projectileHit: { projectile: Projectile; target: Enemy };
  projectileExpired: { projectile: Projectile };
  /** Emitted after an explosion is fully processed */
  explosionProcessed: ExplosionEvent;
  shockwaveTriggered: ShockwaveAttackResult;
  enemyFired: { isBoss: boolean; pattern: AttackPattern };

  // Pickup events
  pickupCollected: { type: PickupType; amount: number; position: Vector2 };
  pickupSpawned: { pickup: Pickup };
  pickupExpired: { pickup: Pickup };

  // Wave events
  waveStart: { waveNumber: number; enemyCount: number };
  waveEnd: { waveNumber: number; enemiesKilled: number };
  bossSpawned: { enemy: Enemy; bossName: string };
  bossDefeated: { enemy: Enemy; bossName: string };

  // Shop events
  shopOpened: void;
  shopClosed: void;
  itemPurchased: { itemId: string; cost: number };
  shopPlayerUpdated: void;
  weaponPurchased: { weaponType: string; cost: number };
  weaponSold: { weaponIndex: number; sellPrice: number };
  weaponMerge: { weaponIndex: number };
  weaponMerged: { weaponType: WeaponType; newLevel: number };
  shopError: void;

  // Game state events
  gamePause: void;
  gameResume: void;
  gameOver: { score: number; wave: number; time: number };

  // UI events
  countdownTick: { seconds: number };

  // HUD re-render trigger
  hudUpdate: void;

  // State transition requests (triggers for StateManager)
  characterSelected: { characterType: CharacterType };
  startGameRequested: void;
  waveCleared: void;
  pauseRequested: void;
  resumeRequested: void;
  quitToMenuRequested: void;
  restartRequested: void;

  // State change notification (emitted by StateManager)
  stateEntered: { state: GameState; from: GameState };
}
