import { CHARACTER_TYPES } from '@/config/characters.config';
import { AudioSystem } from '@/domain/audio/AudioSystem';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { spawnPlayer } from '@/ecs/factories/entity-factories';
import {
  Health,
  PhysicsBody,
  PlayerStats,
  Position,
  Velocity,
  WeaponInventory,
} from '@/ecs/traits';
import { fullHealEntity } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { EntityManager, StateManager } from '@/managers';
import { CollisionResponseSystem } from '@/systems/CollisionResponseSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { DeathSystem } from '@/systems/DeathSystem';
import { EffectsSystem } from '@/systems/EffectsSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { PhysicsSystem } from '@/systems/PhysicsSystem';
import { PickupAttractionSystem } from '@/systems/PickupAttractionSystem';
import { PickupCollisionSystem } from '@/systems/PickupCollisionSystem';
import { PickupSystem } from '@/systems/PickupSystem';
import { PlayerSystem } from '@/systems/PlayerSystem';
import { ProjectileSystem } from '@/systems/ProjectileSystem';
import { ShockwaveSystem } from '@/systems/ShockwaveSystem';
import { Shop } from '@/systems/Shop';
import { WaveManager } from '@/systems/WaveManager';
import { CharacterType, GameState } from '@/types/enums';
import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { injectable } from 'tsyringe';
import { ConfigService } from '../config/ConfigService';
import { WeaponManager } from '../domain/weapons/WeaponManager';
import { TimeManager } from '../managers/TimeManager';
import { PickupSpawnSystem } from './../systems/PickupSpawnSystem';
import { RenderSystem } from './../systems/RenderSystem';
import { RewardSystem } from './../systems/RewardSystem';

@injectable()
export class Game {
  // Canvas
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // State
  private lastTime: number = 0;
  private selectedCharacter: CharacterType | null = null;

  // HUD update throttling
  private lastHUDUpdate: number = 0;

  // Game loop tracking - prevents multiple loops
  private isGameLoopRunning: boolean = false;

  public constructor(
    pickupSpawnSystem: PickupSpawnSystem,
    audioSystem: AudioSystem,
    enemySpawnSystem: EnemySpawnSystem,
    private pickupAttractionSystem: PickupAttractionSystem,
    private collisionSystem: CollisionSystem,
    private collisionResponseSystem: CollisionResponseSystem,
    private configService: ConfigService,
    _deathSystem: DeathSystem,
    private effectsSystem: EffectsSystem,
    private enemySystem: EnemySystem,
    private entityManager: EntityManager,
    private explosionSystem: ExplosionSystem,
    private pickupCollisionSystem: PickupCollisionSystem,
    private physicsSystem: PhysicsSystem,
    private pickupSystem: PickupSystem,
    private playerSystem: PlayerSystem,
    private projectileSystem: ProjectileSystem,
    private renderSystem: RenderSystem,
    private shop: Shop,
    private shockwaveSystem: ShockwaveSystem,
    private stateManager: StateManager,
    private timeManager: TimeManager,
    private waveManager: WaveManager,
    private weaponManager: WeaponManager,
    rewardSystem: RewardSystem,
  ) {
    // These systems auto-connect to EventBus - instantiation is enough
    void pickupSpawnSystem;
    void rewardSystem;
    void audioSystem;
    void enemySpawnSystem;
    // Get canvas
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    const canvasBounds = this.configService.getCanvasBounds();
    this.canvas.width = canvasBounds.width;
    this.canvas.height = canvasBounds.height;

    // Setup state change listeners
    this.setupStateListeners();

    // Auto-pause when the browser tab loses focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.stateManager.getCurrentState() === GameState.PLAYING) {
        EventBus.emit('pauseRequested', undefined);
      }
    });
  }

  /**
   * Setup state change listeners for UI updates.
   * StateManager emits 'stateEntered' events when state transitions occur.
   */
  private setupStateListeners(): void {
    EventBus.on('stateEntered', ({ state, from }) => {
      switch (state) {
        case GameState.MENU:
          this.onEnterMenu();
          break;
        case GameState.PLAYING:
          this.onEnterPlaying(from);
          break;
        case GameState.SHOP:
          this.onEnterShop();
          break;
        case GameState.PAUSED:
          this.onEnterPaused();
          break;
        case GameState.GAME_OVER:
          this.onEnterGameOver();
          break;
      }
    });

    // Listen for characterSelected: store character, then trigger game start
    EventBus.on('characterSelected', ({ characterType }) => {
      this.selectedCharacter = characterType;
      // Preact CharacterSelect handles visual selection
      EventBus.emit('startGameRequested', undefined);
    });

    // Listen for Preact shop item purchases and apply effects
    EventBus.on('itemPurchased', ({ itemId }) => {
      // Skip reroll - it's just for UI refresh, gold is deducted by RewardSystem
      if (itemId === 'reroll') {
        this.emitShopPlayerUpdate();
        return;
      }

      // Apply item effects to player (gold already deducted by RewardSystem)
      this.applyShopPurchase(itemId);
      this.emitShopPlayerUpdate();
      this.updateHUD();
    });
  }

  // ============ State Enter Handlers ============

  private onEnterMenu(): void {
    // Preact App handles all UI state based on stateEntered event
    this.selectedCharacter = null;
  }

  private onEnterPlaying(from: GameState): void {
    // Preact App handles all UI state based on stateEntered event

    // Initialize new game only when coming from menu
    if (from === GameState.MENU) {
      this.initializeNewGame();
    }

    // If coming from PAUSED, emit resume event for AudioSystem etc.
    if (from === GameState.PAUSED) {
      EventBus.emit('gameResume', undefined);
    }

    // If coming from SHOP, start next wave
    if (from === GameState.SHOP) {
      this.startNextWave();
    }

    this.startGameLoop();
  }

  private onEnterShop(): void {
    this.waveManager.endWave();

    const player = this.entityManager.getPlayerEntity();
    fullHealEntity(player);
    player.set(Position, { x: this.canvas.width / 2, y: this.canvas.height / 2 });
    player.set(Velocity, { vx: 0, vy: 0 });
    const body = player.get(PhysicsBody);
    if (body) {
      player.set(PhysicsBody, {
        mass: body.mass,
        friction: body.friction,
        impulseX: 0,
        impulseY: 0,
      });
    }

    this.entityManager.clearExceptPlayer();
    this.effectsSystem.reset();

    EventBus.emit('shopOpened', undefined);
  }

  private onEnterPaused(): void {
    // Preact App handles pause menu visibility based on stateEntered event
    EventBus.emit('gamePause', undefined);
  }

  private onEnterGameOver(): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    const stats = playerEntity.get(PlayerStats)!;
    const health = playerEntity.get(Health)!;
    const inv = playerEntity.get(WeaponInventory)!;

    const weapons = inv.weapons.map((w) => ({ type: w.type, level: w.level }));
    const items = [...inv.items];

    EventBus.emit('gameOver', {
      score: stats.xp,
      wave: this.waveManager.waveNumber,
      time: 0,
      weapons,
      items,
      playerStats: this.snapshotPlayerStats(stats, health),
    });
  }

  private snapshotPlayerStats(
    stats: Omit<LeaderboardPlayerStats, 'maxHp'> & Record<string, unknown>,
    health: { maxHp: number },
  ): LeaderboardPlayerStats {
    return {
      maxHp: health.maxHp,
      armor: stats.armor,
      dodge: stats.dodge,
      regen: stats.regen,
      thorns: stats.thorns,
      lifesteal: stats.lifesteal,
      damageMultiplier: stats.damageMultiplier,
      critChance: stats.critChance,
      critDamage: stats.critDamage,
      attackSpeedMultiplier: stats.attackSpeedMultiplier,
      attackRange: stats.attackRange,
      explosionRadius: stats.explosionRadius,
      knockback: stats.knockback,
      speedMultiplier: stats.speedMultiplier,
      pickupRange: stats.pickupRange,
      luck: stats.luck,
      xpMultiplier: stats.xpMultiplier,
      goldMultiplier: stats.goldMultiplier,
    };
  }

  /**
   * Initialize a new game (called when entering PLAYING from MENU)
   */
  private initializeNewGame(): void {
    this.selectedCharacter ??= CharacterType.NORMIK;

    const charConfig = CHARACTER_TYPES[this.selectedCharacter];

    // Reset entity manager (destroys all entities including old player)
    this.entityManager.clear();

    // Spawn player entity via factory (all stats come from character config)
    spawnPlayer({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      characterType: this.selectedCharacter,
    });

    // Initialize weapons
    this.weaponManager.addWeapon(charConfig.startingWeapon);

    // Reset game state
    this.waveManager.reset();
    this.effectsSystem.reset();
    this.timeManager.reset();

    this.waveManager.startWave();
    this.updateHUD();
  }

  /**
   * Get canvas dimensions (used by DevMenu)
   */
  // TODO probably some Canvas provide / service should be added fo these
  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  // ============ Wave Management ============

  private startNextWave(): void {
    // Preact handles shop visibility via state changes
    this.waveManager.startWave();
  }

  // ============ Game Loop ============

  private gameLoop(timestamp: number): void {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    const currentState = this.stateManager.getCurrentState();

    if (currentState === GameState.PLAYING) {
      this.timeManager.tick(deltaTime);
      this.update();
    }

    this.render();

    if (currentState === GameState.PLAYING) {
      requestAnimationFrame((t) => {
        this.gameLoop(t);
      });
    } else {
      // Loop stopped - mark as not running
      this.isGameLoopRunning = false;
    }
  }

  /**
   * Start the game loop if not already running
   */
  private startGameLoop(): void {
    if (this.isGameLoopRunning) return;
    this.isGameLoopRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => {
      this.gameLoop(t);
    });
  }

  // ============ Update ============

  private update(): void {
    const playerEntity = this.entityManager.getPlayerEntity();

    // Update player (input, movement, regen, auto-aim)
    this.playerSystem.update();

    // Check if boss is alive
    const bossAlive = this.entityManager.getActiveBosses().length > 0;

    // Update wave manager
    const waveResult = this.waveManager.update(bossAlive);

    // Countdown sound
    if (waveResult.countdown !== false) {
      EventBus.emit('countdownTick', { seconds: waveResult.countdown });
    }

    if (waveResult.waveEnded) {
      EventBus.emit('waveCleared', { waveNumber: this.waveManager.waveNumber });
      return;
    }

    // Fire weapons
    this.weaponManager.fireWeapons(playerEntity);

    // Update entity systems
    this.enemySystem.update();
    this.projectileSystem.update();
    this.pickupSystem.update();

    // Magnet attraction
    this.pickupAttractionSystem.update();

    // Physics: force→velocity→position (knockback, grenade friction)
    this.physicsSystem.update();

    // Update shockwave positions (follow owner) and animation
    this.shockwaveSystem.update();

    // === Collision Detection & Response ===
    const collisions = this.collisionSystem.checkAll();

    // 1. Route collisions → DamageSystem (registers deaths but does NOT process them yet)
    this.collisionResponseSystem.processCollisions(collisions);

    // 2. Pickups BEFORE death check — health pickups can save the player
    this.pickupCollisionSystem.processPickups(collisions.pickupCollisions);

    // 3. Death ↔ Explosion chain resolution loop
    this.explosionSystem.resolveChain();

    // Update visual effects (particles, explosions)
    this.effectsSystem.update();

    // Cleanup
    this.entityManager.removeInactive();

    // TODO migrate to canvas overlay HUD?
    // Throttle HUD updates to reduce DOM manipulation cost (60 FPS → 10 updates/sec)
    const currentTime = TimeManager.elapsed();
    if (currentTime - this.lastHUDUpdate >= 100) {
      this.updateHUD();
      this.lastHUDUpdate = currentTime;
    }
  }

  // ============ Render ============

  private render(): void {
    this.renderSystem.renderAll(this.ctx);
  }

  // ============ HUD ============

  private updateHUD(): void {
    EventBus.emit('hudUpdate', undefined);
  }

  /**
   * Apply shop purchase effects to player.
   * Called when Preact Shop emits itemPurchased event.
   * Gold deduction is handled by RewardSystem.
   */
  private applyShopPurchase(itemId: string): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    this.shop.applyItemEffect(itemId, playerEntity);
  }

  /**
   * Notify UI that player state changed after shop purchase
   */
  private emitShopPlayerUpdate(): void {
    EventBus.emit('shopPlayerUpdated', undefined);
  }
}
