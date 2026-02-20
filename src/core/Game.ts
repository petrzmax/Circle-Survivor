import { CHARACTER_TYPES } from '@/config/characters.config';
import { AudioSystem } from '@/domain/audio/AudioSystem';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { Player } from '@/domain/player/Player';
import { EventBus } from '@/events/EventBus';
import { EntityManager, StateManager } from '@/managers';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { EffectsSystem } from '@/systems/EffectsSystem';
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
    private combatSystem: CombatSystem,
    private configService: ConfigService,
    private effectsSystem: EffectsSystem,
    private enemySystem: EnemySystem,
    private entityManager: EntityManager,
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

    const player = this.entityManager.getPlayer();
    player.hp = player.maxHp; // Full heal
    player.position.x = this.canvas.width / 2; // Center player
    player.position.y = this.canvas.height / 2;

    this.entityManager.clearExceptPlayer();
    this.effectsSystem.reset();

    // Preact Shop component handles rendering via shopOpened event
    EventBus.emit('shopOpened', undefined);
  }

  private onEnterPaused(): void {
    // Preact App handles pause menu visibility based on stateEntered event
    EventBus.emit('gamePause', undefined);
  }

  private onEnterGameOver(): void {
    const player = this.entityManager.getPlayer();

    // Preact App handles game over UI based on gameOver event
    EventBus.emit('gameOver', {
      score: player.xp,
      wave: this.waveManager.waveNumber,
      time: 0,
    });
  }

  /**
   * Initialize a new game (called when entering PLAYING from MENU)
   */
  private initializeNewGame(): void {
    this.selectedCharacter ??= CharacterType.NORMIK;

    // Get character config
    const charConfig = CHARACTER_TYPES[this.selectedCharacter];

    // Create player
    const player = new Player({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      characterType: this.selectedCharacter,
    });

    // Apply character-specific stats
    player.maxHp = charConfig.maxHp;
    player.hp = charConfig.maxHp;
    player.speedMultiplier = 1;
    player.damageMultiplier = charConfig.damageMultiplier;
    player.goldMultiplier = charConfig.goldMultiplier;
    player.color = charConfig.color;

    // Reset entity manager and set player
    this.entityManager.clear();
    this.entityManager.setPlayer(player);

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
    const player = this.entityManager.getPlayer();
    const deltaTime = deltaTimeMs / 1000;

    // Update player (input, movement, regen, auto-aim)
    this.playerSystem.update(deltaTime, currentTime);

    // Check if boss is alive
    const bossAlive = this.entityManager.getActiveEnemies().some((e) => e.isBoss);

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

    // Update CombatSystem runtime config with current player stats
    this.combatSystem.updateRuntimeConfig({
      damageMultiplier: player.damageMultiplier,
      explosionRadius: player.explosionRadius,
      knockback: player.knockback,
    });

    // Fire weapons
    this.weaponManager.fireWeapons(currentTime, player);

    // Update entity systems
    this.enemySystem.update(deltaTime, currentTime);
    this.projectileSystem.update(deltaTime);
    this.pickupSystem.update(deltaTime);

    // Magnet attraction
    this.pickupAttractionSystem.update(deltaTime);

    // === Collision Detection & Combat Processing ===
    const collisions = this.collisionSystem.checkAll();
    this.combatSystem.processCollisions(collisions, currentTime);

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
    // Emit HUD update as trigger — player data read directly from EntityManager by hooks
    EventBus.emit('hudUpdate', {
      waveNumber: this.waveManager.waveNumber,
      timeRemaining: this.waveManager.timeRemaining,
      isWaveActive: this.waveManager.isWaveActive,
    });
  }

  /**
   * Apply shop purchase effects to player.
   * Called when Preact Shop emits itemPurchased event.
   * Gold deduction is handled by RewardSystem.
   */
  private applyShopPurchase(itemId: string): void {
    const player = this.entityManager.getPlayer();

    // Use existing shop buyItem logic but skip the price check & event emission
    // since those are already handled
    this.shop.applyItemEffect(itemId, player);
  }

  /**
   * Notify UI that player state changed after shop purchase
   */
  private emitShopPlayerUpdate(): void {
    EventBus.emit('shopPlayerUpdated', undefined);
  }
}
