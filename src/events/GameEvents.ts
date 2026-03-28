import { AttackPattern, ShockwaveAttackResult } from '@/domain/enemies/type';
import { WeaponType } from '@/domain/weapons';
import { DamageSource, ExplosionEvent, KillSource } from '@/systems/damage.types';
import { CharacterType, EnemyType, GameState, PickupType } from '@/types';
import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { Vector2 } from '@/utils';

/** Snapshot of enemy data at time of death — no adapter reference */
export interface EnemyDeathData {
  position: Vector2;
  type: EnemyType;
  color: string;
  radius: number;
  isBoss: boolean;
  xpValue: number;
  goldValue: number;
  splitOnDeath: boolean;
  splitCount: number;
}

/**
 * Event payload types for type-safe event handling
 */
export interface GameEvents {
  // Combat events
  enemyDeath: { enemy: EnemyDeathData; killer: KillSource };
  /** Unified damage event emitted by DamageSystem for any entity */
  entityDamaged: {
    entityId: number;
    damage: number;
    source: Vector2;
    damageSource: DamageSource;
    isPlayer: boolean;
  };
  // TODO(feature): Emit killer info (EnemyDeathData | DamageSource) for death screen / stats.
  playerDeath: void;
  playerDodged: void;
  thornsTriggered: void;

  // Explosion queue event — any system can emit to queue an explosion
  queueExplosion: ExplosionEvent;

  // Weapon events
  weaponFired: { weaponType: WeaponType };

  // Projectile events
  projectileHit: { projectileId: number; targetId: number; position: Vector2 };
  /** Emitted after an explosion is fully processed */
  explosionProcessed: ExplosionEvent;
  shockwaveTriggered: ShockwaveAttackResult;
  enemyFired: { isBoss: boolean; pattern: AttackPattern };

  // Pickup events
  pickupCollected: { type: PickupType; amount: number; position: Vector2 };

  // Wave events
  waveStart: { waveNumber: number; enemyCount: number };
  waveEnd: { waveNumber: number; enemiesKilled: number };
  bossSpawned: { bossName: string };
  bossDefeated: { bossName: string };

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
  gameOver: {
    score: number;
    wave: number;
    time: number;
    weapons: Array<{ type: string; level: number }>;
    items: string[];
    playerStats: LeaderboardPlayerStats;
  };

  // UI events
  countdownTick: { seconds: number };

  // HUD re-render trigger
  hudUpdate: void;

  // State transition requests (triggers for StateManager)
  characterSelected: { characterType: CharacterType };
  startGameRequested: void;
  waveCleared: { waveNumber: number };
  waveClearAnimationDone: void;
  pauseRequested: void;
  resumeRequested: void;
  quitToMenuRequested: void;
  restartRequested: void;

  // State change notification (emitted by StateManager)
  stateEntered: { state: GameState; from: GameState };
}
