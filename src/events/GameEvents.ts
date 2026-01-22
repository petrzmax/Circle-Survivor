import { Enemy } from "@/domain/enemies";
import { Player, Projectile, Pickup } from "@/entities";
import { WeaponType, VisualEffect, CharacterType, GameState } from "@/types";
import { Vector2 } from "@/utils";

/**
 * Event payload types for type-safe event handling
 */
export interface GameEvents {
  // Combat events
  enemyDeath: { enemy: Enemy; killer: 'player' | 'explosion'; };
  enemyDamaged: { enemy: Enemy; damage: number; source: Vector2; };
  playerHit: { player: Player; damage: number; source: Enemy | Projectile | 'explosion'; };
  playerDeath: { player: Player; killedBy: Enemy | null; };
  playerDodged: void;
  thornsTriggered: void;

  // Weapon events
  weaponFired: { weaponType: WeaponType; };

  // Projectile events
  projectileHit: { projectile: Projectile; target: Enemy; };
  projectileExpired: { projectile: Projectile; };
  explosionTriggered: {
    position: Vector2;
    radius: number;
    damage: number;
    visualEffect: VisualEffect;
  };

  // Pickup events
  goldCollected: { amount: number; position: Vector2; };
  healthCollected: { amount: number; position: Vector2; };
  pickupSpawned: { pickup: Pickup; };
  pickupExpired: { pickup: Pickup; };

  // Wave events
  waveStart: { waveNumber: number; enemyCount: number; };
  waveEnd: { waveNumber: number; enemiesKilled: number; };
  bossSpawned: { enemy: Enemy; bossName: string; };
  bossDefeated: { enemy: Enemy; bossName: string; };

  // Shop events
  shopOpened: {
    gold: number;
    waveNumber: number;
    playerState: {
      gold: number;
      weapons: Array<{ type: WeaponType; name: string; level: number; }>;
      maxWeapons: number;
      items?: string[];
    };
  };
  shopClosed: void;
  itemPurchased: { itemId: string; cost: number; };
  shopPlayerUpdated: {
    gold: number;
    weapons: Array<{ type: WeaponType; name: string; level: number; }>;
    maxWeapons: number;
    items: string[];
  };
  weaponPurchased: { weaponType: string; cost: number; };
  weaponSold: { weaponIndex: number; sellPrice: number; };
  shopError: void;

  // Game state events
  gamePause: void;
  gameResume: void;
  gameOver: { score: number; wave: number; time: number; };

  // UI events
  countdownTick: { seconds: number; };
  audioToggleRequested: void;
  audioStateChanged: { enabled: boolean; };
  // TODO use it as trigger only, data get from systems, and managers or remove part of these as it will be on different screen.
  hudUpdate: {
    hp: number;
    maxHp: number;
    gold: number;
    xp: number;
    armor: number;
    damageMultiplier: number;
    critChance: number;
    dodge: number;
    regen: number;
    waveNumber: number;
    timeRemaining: number;
    isWaveActive: boolean;
  };

  // State transition requests (triggers for StateManager)
  characterSelected: { characterType: CharacterType; };
  startGameRequested: void;
  waveCleared: void;
  pauseRequested: void;
  resumeRequested: void;
  quitToMenuRequested: void;
  restartRequested: void;

  // State change notification (emitted by StateManager)
  stateEntered: { state: GameState; from: GameState; };
}
