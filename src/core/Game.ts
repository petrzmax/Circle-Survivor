import { CHARACTER_TYPES } from '@/config/characters.config';
import { AudioSystem } from '@/domain/audio/AudioSystem';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { spawnPlayer } from '@/ecs/factories/entity-factories';
import { Position } from '@/ecs/traits';
import { fullHealEntity } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { EntityManager, StateManager } from '@/managers';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { CollisionResponseSystem } from '@/systems/CollisionResponseSystem';
import { DeathSystem } from '@/systems/DeathSystem';
import { EffectsSystem } from '@/systems/EffectsSystem';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { PickupCollisionSystem } from '@/systems/PickupCollisionSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { PickupAttractionSystem } from '@/systems/PickupAttractionSystem';
import { PickupSystem } from '@/systems/PickupSystem';
import { PlayerSystem } from '@/systems/PlayerSystem';
import { ProjectileSystem } from '@/systems/ProjectileSystem';
import { Shop } from '@/systems/Shop';
import { WaveManager } from '@/systems/WaveManager';
import { CharacterType, GameState } from '@/types/enums';
import { injectable } from 'tsyringe';
import { ConfigService } from '../config/ConfigService';
import { WeaponManager } from '../domain/weapons/WeaponManager';
import { Time, world } from '../ecs/world';
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
    private pickupSystem: PickupSystem,
    private playerSystem: PlayerSystem,
    private projectileSystem: ProjectileSystem,
    private renderSystem: RenderSystem,
    private shop: Shop,
    private stateManager: StateManager,
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

    // Wire shockwave data from EffectsSystem to CollisionSystem
    this.collisionSystem.setShockwaveProvider(() => this.effectsSystem.getActiveShockwaves());

    // Setup state change listeners
    this.setupStateListeners();
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
    player.set(Position, { x: this.canvas.width / 2, y: this.canvas.height / 2 }); // Center

    this.entityManager.clearExceptPlayer();
    this.effectsSystem.reset();

    EventBus.emit('shopOpened', undefined);
  }

  private onEnterPaused(): void {
    // Preact App handles pause menu visibility based on stateEntered event
    EventBus.emit('gamePause', undefined);
  }

  private onEnterGameOver(): void {
    const stats = this.entityManager.getPlayerStats();

    EventBus.emit('gameOver', {
      score: stats.xp,
      wave: this.waveManager.waveNumber,
      time: 0,
    });
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
      this.update(deltaTime, timestamp);
    }

    this.render();

    // Continue loop only for active game states
    if (currentState === GameState.PLAYING || currentState === GameState.SHOP) {
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

  private update(deltaTimeMs: number, currentTime: number): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    const deltaTime = deltaTimeMs / 1000;

    // Update ECS world time resource
    const prevTime = world.get(Time);
    world.set(Time, {
      delta: deltaTime,
      elapsed: (prevTime?.elapsed ?? 0) + deltaTime,
      current: currentTime,
    });

    // Update player (input, movement, regen, auto-aim)
    this.playerSystem.update(deltaTime, currentTime);

    // Check if boss is alive
    const bossAlive = this.entityManager.getActiveBosses().length > 0;

    // Update wave manager (expects milliseconds)
    const waveResult = this.waveManager.update(deltaTimeMs, bossAlive);

    // Countdown sound
    if (waveResult.countdown !== false) {
      EventBus.emit('countdownTick', { seconds: waveResult.countdown });
    }

    if (waveResult.waveEnded) {
      EventBus.emit('waveCleared', undefined);
      return;
    }

    // Fire weapons
    this.weaponManager.fireWeapons(currentTime, playerEntity);

    // Update entity systems
    this.enemySystem.update(deltaTime, currentTime);
    this.projectileSystem.update(deltaTime);
    this.pickupSystem.update(deltaTime);

    // Magnet attraction
    this.pickupAttractionSystem.update(deltaTime);

    // === Collision Detection & Response ===
    const collisions = this.collisionSystem.checkAll();

    // 1. Route collisions → DamageSystem (registers deaths but does NOT process them yet)
    this.collisionResponseSystem.processCollisions(collisions, currentTime);

    // 2. Pickups BEFORE death check — health pickups can save the player
    this.pickupCollisionSystem.processPickups(collisions.pickupCollisions);

    // 3. Death ↔ Explosion chain resolution loop
    this.explosionSystem.resolveChain(currentTime);

    // Update visual effects (particles, explosions, shockwaves)
    this.effectsSystem.update(currentTime, deltaTime);

    // Cleanup
    this.entityManager.removeInactive();

    // TODO migrate to canvas overlay HUD?
    // Throttle HUD updates to reduce DOM manipulation cost (60 FPS → 10 updates/sec)
    if (currentTime - this.lastHUDUpdate >= 100) {
      this.updateHUD();
      this.lastHUDUpdate = currentTime;
    }
  }

  // ============ Render ============

  private render(): void {
    this.renderSystem.renderAll(this.ctx, this.lastTime);
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
