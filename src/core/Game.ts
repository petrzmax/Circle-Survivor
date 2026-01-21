import { injectable } from 'tsyringe';
import toast from 'react-hot-toast';
import { GAME_BALANCE } from '@/config/balance.config';
import { CHARACTER_TYPES } from '@/config/characters.config';
import { EventBus } from '@/core/EventBus';
import { AudioSystem } from '@/domain/audio/AudioSystem';
import { Enemy } from '@/domain/enemies';
import { WeaponConfig, WeaponInstance } from '@/domain/weapons/type';
import { Deployable, DeployableConfig } from '@/entities/Deployable';
import { Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import { EntityManager, StateManager } from '@/managers';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { EffectsSystem } from '@/systems/EffectsSystem';
import { HUD } from '@/systems/HUD';
import { InputSystem } from '@/systems/InputSystem';
import { WaveManager } from '@/systems/WaveManager';
import {
  CharacterType,
  DeployableType,
  EnemyType,
  GameState,
  ProjectileType,
  VisualEffect,
  WeaponType,
} from '@/types/enums';
import { Shop, ShopPlayer, ShopWeapon } from '@/systems/Shop';
import {
  copyVector,
  degreesToRadians,
  distance,
  randomChance,
  randomRange,
  vectorFromAngle,
} from '@/utils';
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

  // Systems (not injected - no deps or special cases)
  private effectsSystem: EffectsSystem;

  // Regeneration tracking
  private lastRegenTime: number = 0;

  // HUD update throttling
  private lastHUDUpdate: number = 0;

  // Game loop tracking - prevents multiple loops
  private isGameLoopRunning: boolean = false;

  // Debug display options
  private showEnemyCount: boolean = false;

  public constructor(
    private stateManager: StateManager,
    private entityManager: EntityManager,
    private collisionSystem: CollisionSystem,
    private combatSystem: CombatSystem,
    private inputSystem: InputSystem,
    private renderSystem: RenderSystem,
    pickupSpawnSystem: PickupSpawnSystem,
    rewardSystem: RewardSystem,
    private waveManager: WaveManager,
    private shop: Shop,
  ) {
    // These systems auto-connect to EventBus - instantiation is enough
    void pickupSpawnSystem;
    void rewardSystem;
    // Get canvas
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = 900;
    this.canvas.height = 700;

    // Initialize systems without DI (no deps or special cases)
    this.effectsSystem = new EffectsSystem();

    // AudioSystem initializes itself via EventBus - no reference needed
    new AudioSystem();

    // Setup state change listeners
    this.setupStateListeners();

    // Bind to window for global access
    (window as unknown as { game: Game }).game = this;

    // Initialize dev menu (development only)
    if (import.meta.env.DEV) {
      void this.initDevMenu();
    }
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

    // Listen for weapon sell events from shop
    EventBus.on('weaponSold', ({ weaponIndex }) => {
      const player = this.entityManager.getPlayer();
      const removed = player.removeWeaponAt(weaponIndex);

      if (removed) {
        toast(`💰 Sprzedano ${removed.name}`);
        this.emitShopPlayerUpdate();
        this.updateHUD();
      }
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

    // Preact Shop component handles rendering via shopOpened event
    EventBus.emit('shopOpened', {
      gold: player.gold,
      waveNumber: this.waveManager.waveNumber,
      playerState: {
        gold: player.gold,
        weapons: player.weapons.map((w) => ({ type: w.type, name: w.name, level: w.level })),
        maxWeapons: player.maxWeapons,
        items: [...player.items],
      },
    });
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
    player.speed = charConfig.speed;
    player.damageMultiplier = charConfig.damageMultiplier;
    player.goldMultiplier = charConfig.goldMultiplier;
    player.color = charConfig.color;

    // Reset entity manager and set player
    this.entityManager.clear();
    this.entityManager.setPlayer(player);

    // Initialize weapons
    this.addWeapon(charConfig.startingWeapon);

    // Reset game state
    this.waveManager = new WaveManager();

    this.waveManager.startWave();
    this.updateHUD();
  }

  /**
   * Initialize dev menu with dependency injection
   */
  private async initDevMenu(): Promise<void> {
    const { DevMenu } = await import('@/debug/DevMenu');
    new DevMenu({
      // State Manager
      stateManager: this.stateManager,
      getCanvasSize: () => ({ width: this.canvas.width, height: this.canvas.height }),

      // Debug display options
      setShowEnemyCount: (show) => {
        this.showEnemyCount = show;
      },

      // Wave control
      getCurrentWave: () => this.waveManager.currentWave,
      skipToWave: (wave) => {
        this.waveManager.skipToWave(wave);
      },

      // Player actions
      getPlayer: () => {
        const player = this.entityManager.getPlayer();
        return {
          hp: player.hp,
          maxHp: player.maxHp,
          godMode: player.godMode,
          setGodMode: (enabled) => {
            player.godMode = enabled;
          },
          heal: (amount) => {
            player.heal(amount);
          },
          addItem: (itemId) => {
            player.addItem(itemId);
          },
          applyStat: (stat, value) => {
            player.applyStat(stat as keyof import('@/entities/Player').PlayerStats, value);
          },
        };
      },

      // Entity actions
      addWeapon: (type) => {
        this.addWeapon(type);
      },
      spawnEnemy: (type, x, y) => {
        this.spawnEnemy(type, x, y);
      },
      killAllEnemies: () => {
        this.killAllEnemies();
      },
    });
  }

  /**
   * Kill all active enemies (dev tool)
   */
  private killAllEnemies(): void {
    const enemies = this.entityManager.getActiveEnemies();
    for (const enemy of enemies) {
      enemy.destroy();
    }
  }

  // ============ Wave Management ============

  private startNextWave(): void {
    // Preact handles shop visibility via state changes
    this.waveManager.startWave();
  }

  // ============ Weapon Management ============

  private addWeapon(type: WeaponType): void {
    const player = this.entityManager.getPlayer();

    // Let player handle weapon creation and management
    const added = player.addWeapon(type);
    if (!added) return;

    // Recalculate fire offsets for staggered shooting
    this.recalculateFireOffsets();
  }

  /**
   * Spread shots evenly for weapons of the same type.
   * Assigns staggered offsets so weapons don't all fire at once.
   */
  private recalculateFireOffsets(): void {
    const player = this.entityManager.getPlayer();

    // Group weapons by type
    const weaponsByType: Record<string, WeaponInstance[]> = {};
    for (const weapon of player.weapons) {
      weaponsByType[weapon.type] ??= [];
      weaponsByType[weapon.type]?.push(weapon);
    }

    // Assign staggered offsets within each type group
    for (const type in weaponsByType) {
      const weapons = weaponsByType[type]!;
      const count = weapons.length;
      for (let i = 0; i < count; i++) {
        // Offset each weapon by fraction of fire rate
        weapons[i]!.fireOffset = (i / count) * weapons[i]!.config.fireRate;
      }
    }
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

  private update(deltaTime: number, currentTime: number): void {
    const player = this.entityManager.getPlayer();

    const deltaSeconds = deltaTime / 1000;

    // Poll gamepad state and get unified input
    this.inputSystem.poll();
    const input = this.inputSystem.getInputState();

    // Update player movement
    player.updateMovement(input, this.canvas.width, this.canvas.height, deltaSeconds);

    // TODO handle in passivesSystem?
    if (player.regen > 0) {
      if (!this.lastRegenTime) this.lastRegenTime = currentTime;
      if (currentTime - this.lastRegenTime >= 1000) {
        player.heal(player.regen);
        this.lastRegenTime = currentTime;
      }
    }

    // Check if boss is alive
    const bossAlive = this.entityManager.getActiveEnemies().some((e) => e.isBoss);

    // Update wave manager
    const waveResult = this.waveManager.update(deltaTime, this.canvas, bossAlive);

    // Add spawned enemies
    for (const enemy of waveResult.enemies) {
      this.entityManager.addEnemy(enemy);
    }

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

    // Find nearest enemy for auto-aim (only within map bounds)
    const canvasBounds = { width: this.canvas.width, height: this.canvas.height };
    const nearestEnemy = this.entityManager.getNearestEnemy(
      player.position,
      undefined,
      canvasBounds,
    );
    player.setTarget(nearestEnemy ? nearestEnemy.position : null);

    // Fire weapons
    this.fireWeapons(currentTime, player);

    // Update enemies (movement, boss shooting)
    const enemies = this.entityManager.getActiveEnemies();
    for (const enemy of enemies) {
      enemy.update(deltaSeconds);
      enemy.moveTowardsTarget(player.position, deltaSeconds, this.canvas.width, this.canvas.height);

      // Boss shooting (creates projectiles/shockwaves)
      if (enemy.canShoot) {
        const attackResult = enemy.tryAttack(player.position, currentTime);
        if (attackResult) {
          if (attackResult.type === 'bullets') {
            // Create enemy projectiles
            for (const bulletData of attackResult.bullets) {
              const projectile = new Projectile({
                position: {
                  x: bulletData.x,
                  y: bulletData.y,
                },
                radius: Math.floor(enemy.radius * 0.15), // default 6
                type: ProjectileType.ENEMY_BULLET,
                damage: bulletData.damage,
                ownerId: enemy.id,
                color: bulletData.color,
                maxDistance: 1000,
              });
              projectile.setVelocity(bulletData.vx, bulletData.vy);
              this.entityManager.addProjectile(projectile);
            }
            // Currently only shockwave type exists, but may have more attack types in future
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (attackResult.type === 'shockwave') {
            this.effectsSystem.createShockwave(attackResult);
          }
        }
      }
    }

    // Update projectiles (movement, expire, off-screen removal)
    const projectiles = this.entityManager.getActiveProjectiles();
    for (const projectile of projectiles) {
      projectile.update(deltaSeconds);

      // Remove expired - but check if grenade should explode first
      if (!projectile.isActive) {
        // Grenades explode when they reach their target distance
        if (projectile.shouldExplodeOnExpire && projectile.isExplosive() && projectile.explosive) {
          const expRadius = projectile.explosive.explosionRadius * player.explosionRadius;
          const isMini = projectile.type === ProjectileType.MINI_BANANA;
          this.combatSystem.triggerExplosion(
            projectile.position,
            expRadius,
            projectile.damage * player.damageMultiplier,
            projectile.explosive.visualEffect,
            isMini,
          );
        }
        this.entityManager.removeProjectile(projectile.id);
        continue;
      }

      // Off screen check - destroy projectiles that left the screen
      if (
        projectile.position.x < -50 ||
        projectile.position.x > this.canvas.width + 50 ||
        projectile.position.y < -50 ||
        projectile.position.y > this.canvas.height + 50
      ) {
        projectile.destroy();
      }
    }

    // Update deployables (mines) - just movement/animation
    const deployables = this.entityManager.getActiveDeployables();
    for (const deployable of deployables) {
      deployable.update(deltaSeconds);
    }

    // Update pickups (movement, magnet attraction)
    const pickups = this.entityManager.getActivePickups();
    for (const pickup of pickups) {
      pickup.update(deltaSeconds);

      if (!pickup.isActive) continue;

      // Magnet attraction - only works if player has magnet item
      const hasMagnet = player.items.includes('magnet');
      const distToPlayer = distance(pickup.position, player.position);
      if (hasMagnet && (distToPlayer < player.pickupRange || pickup.isAttracted)) {
        pickup.isAttracted = true;
        const dx = player.position.x - pickup.position.x;
        const dy = player.position.y - pickup.position.y;
        if (distToPlayer > 0) {
          // Scale attraction speed:
          // 1. Base speed = player speed * multiplier (always faster than player)
          // 2. Distance factor modulates speed based on proximity
          const speedMultiplier = GAME_BALANCE.pickup.playerSpeedMultiplier;
          const minFactor = GAME_BALANCE.pickup.minDistanceFactor;
          const maxFactor = GAME_BALANCE.pickup.maxDistanceFactor;
          // Clamp normalized distance to [0, 1] to prevent weird behavior when outside range
          const normalizedDistance = Math.min(1, distToPlayer / player.pickupRange);
          // Interpolate from maxFactor (close) to minFactor (far)
          const distanceFactor = maxFactor - (maxFactor - minFactor) * normalizedDistance;
          const magnetSpeed = player.speed * speedMultiplier * distanceFactor;

          pickup.position.x += (dx / distToPlayer) * magnetSpeed;
          pickup.position.y += (dy / distToPlayer) * magnetSpeed;
        }
      }
    }

    // === Collision Detection & Combat Processing ===
    // All collision handling is delegated to CollisionSystem + CombatSystem
    const collisions = this.collisionSystem.checkAll();
    this.combatSystem.processCollisions(collisions, currentTime);

    // Update shockwaves
    this.updateShockwaves(currentTime);

    // Cleanup
    this.entityManager.removeInactive();

    // TODO migrate to canvas overlay HUD?
    // Throttle HUD updates to reduce DOM manipulation cost (60 FPS → 10 updates/sec)
    if (currentTime - this.lastHUDUpdate >= 100) {
      this.updateHUD();
      this.lastHUDUpdate = currentTime;
    }
  }

  // ============ Weapon Firing ============

  private fireWeapons(currentTime: number, player: Player): void {
    for (let i = 0; i < player.weapons.length; i++) {
      const weapon = player.weapons[i]!;
      const config = weapon.config;

      // Calculate fire rate with level and player multiplier
      const levelMultiplier = 1 + (weapon.level - 1) * 0.1;
      const fireRate = config.fireRate / levelMultiplier / player.attackSpeedMultiplier;

      // Include fire offset for staggered shooting
      if (currentTime - weapon.lastFireTime < fireRate + weapon.fireOffset) continue;

      // Reset offset after first shot (staggering only applies to initial burst)
      weapon.fireOffset = 0;

      // Handle deployable weapons (mines) - they don't need a target
      if (config.deployableType === DeployableType.MINE) {
        weapon.lastFireTime = currentTime;
        this.deployMine(config, player, weapon.level);
        continue;
      }

      // Get weapon position (use currentTarget for positioning only)
      const weaponPos = player.getWeaponPosition(i, player.currentTarget);
      const maxRange = config.range * player.attackRange;

      // Find nearest enemy from weapon position within map bounds
      const canvasBounds = { width: this.canvas.width, height: this.canvas.height };
      let target = this.entityManager.getNearestEnemy(weaponPos, maxRange, canvasBounds);

      // Fallback to main target if within range
      if (!target && player.currentTarget) {
        const dx = player.currentTarget.x - weaponPos.x;
        const dy = player.currentTarget.y - weaponPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= maxRange) {
          // Find the actual enemy at currentTarget position within map bounds
          target = this.entityManager.getNearestEnemy(player.currentTarget, 50, canvasBounds);
        }
      }

      if (!target) continue;

      weapon.lastFireTime = currentTime;

      // Calculate damage with level
      const baseDamage = config.damage * (1 + (weapon.level - 1) * 0.15);

      // Calculate projectile count (bulletCount is base, multishot and projectileCount are bonuses)
      const projectileCount = config.bulletCount + weapon.multishot + player.projectileCount;

      // Fire based on weapon type - pass target position for correct aiming
      this.fireWeaponProjectiles(weapon, weaponPos, target, baseDamage, projectileCount, player);
    }
  }

  private fireWeaponProjectiles(
    weapon: WeaponInstance,
    pos: { x: number; y: number; angle: number },
    target: Enemy,
    damage: number,
    projectileCount: number,
    player: Player,
  ): void {
    const config = weapon.config;
    // Always calculate angle to target - not using pos.angle fallback
    const targetAngle = Math.atan2(target.position.y - pos.y, target.position.x - pos.x);

    // Critical hit check
    const isCrit = randomChance(player.critChance);
    const finalDamage = isCrit ? damage * player.critDamage : damage;

    for (let i = 0; i < projectileCount; i++) {
      // Spread angle for multiple projectiles (spread is in degrees)
      let angle = targetAngle;
      if (projectileCount > 1) {
        const spreadRad = degreesToRadians(config.spread);
        // Distribute bullets evenly across spread
        angle = targetAngle - spreadRad / 2 + (spreadRad / (projectileCount - 1)) * i;
      } else if (config.spread > 0) {
        // Random spread for single bullet
        const spreadRad = randomRange(-0.5, 0.5) * degreesToRadians(config.spread);
        angle += spreadRad;
      }

      const speed = config.bulletSpeed;
      const velocityVector = vectorFromAngle(angle, speed);

      const projectile = new Projectile({
        position: { x: pos.x, y: pos.y },
        radius: config.bulletRadius ?? 4, // Default 4 like original
        type: this.getProjectileType(weapon.type),
        damage: finalDamage,
        ownerId: player.id,
        color: config.color,
        maxDistance: config.shortRange ? (config.maxDistance ?? config.range) : 0, // 0 = infinite
        pierce: config.pierce
          ? { pierceCount: (config.pierceCount ?? 1) + player.pierce, hitEnemies: new Set() }
          : undefined,
        explosive: config.explosive
          ? {
              explosionRadius: config.explosionRadius ?? 50,
              explosionDamage: finalDamage,
              visualEffect: this.getExplosionEffect(weapon.type),
            }
          : undefined,
        // Grenade properties for slowdown/explosion behavior
        weaponCategory: config.weaponCategory,
        explosiveRange: config.explosiveRange,
        bulletSpeed: speed,
        // Projectile rotation (e.g., scythe)
        rotationSpeed: config.rotationSpeed,
      });

      projectile.setVelocityVector(velocityVector);
      projectile.isCrit = isCrit;
      projectile.knockbackMultiplier = config.knockbackMultiplier ?? 1;

      this.entityManager.addProjectile(projectile);
    }

    // Play weapon sound
    EventBus.emit('weaponFired', { weaponType: weapon.type });
  }

  private getProjectileType(weaponType: WeaponType): ProjectileType {
    const mapping: Partial<Record<WeaponType, ProjectileType>> = {
      [WeaponType.SCYTHE]: ProjectileType.SCYTHE,
      [WeaponType.SWORD]: ProjectileType.SWORD,
      [WeaponType.BAZOOKA]: ProjectileType.ROCKET,
      [WeaponType.NUKE]: ProjectileType.NUKE,
      [WeaponType.FLAMETHROWER]: ProjectileType.FLAMETHROWER,
      [WeaponType.LASER]: ProjectileType.STANDARD, // Laser uses standard projectile type
      [WeaponType.BANANA]: ProjectileType.BANANA,
      [WeaponType.HOLY_GRENADE]: ProjectileType.HOLY_GRENADE,
      [WeaponType.CROSSBOW]: ProjectileType.CROSSBOW_BOLT,
    };
    return mapping[weaponType] ?? ProjectileType.STANDARD;
  }

  private getExplosionEffect(weaponType: WeaponType): VisualEffect {
    if (weaponType === WeaponType.NUKE) return VisualEffect.NUKE;
    if (weaponType === WeaponType.HOLY_GRENADE) return VisualEffect.HOLY;
    if (weaponType === WeaponType.BANANA) return VisualEffect.BANANA;
    return VisualEffect.STANDARD;
  }

  /**
   * Deploy a mine at the player's position
   */
  private deployMine(config: WeaponConfig, player: Player, level: number): void {
    // Calculate damage with level
    const levelMultiplier = 1 + (level - 1) * 0.15;
    const damage = config.damage * levelMultiplier * player.damageMultiplier;

    // Create deployable config
    const deployableConfig: DeployableConfig = {
      position: copyVector(player.position), // Copy position so mine doesn't follow player
      radius: config.bulletRadius ?? 12,
      type: DeployableType.MINE,
      damage: damage,
      ownerId: player.id,
      color: config.color,
      explosionRadius: (config.explosionRadius ?? 70) * player.explosionRadius,
      explosionDamage: damage,
      visualEffect: VisualEffect.STANDARD,
      armingTime: 0.5, // 500ms arming time
    };

    const mine = new Deployable(deployableConfig);
    this.entityManager.addDeployable(mine);

    // Play mine deploy sound
    EventBus.emit('weaponFired', { weaponType: WeaponType.MINES });
  }

  // ============ Dev Tools ============

  /**
   * Spawn enemy at position (used by DevMenu)
   * TODO: When SpawnSystem is fully integrated, delegate to SpawnSystem.spawnEnemyAt()
   */
  private spawnEnemy(type: EnemyType, x: number, y: number): void {
    const enemy = new Enemy({ position: { x, y }, type });
    this.entityManager.addEnemy(enemy);

    if (enemy.isBoss) {
      EventBus.emit('bossSpawned', { enemy, bossName: enemy.bossName ?? 'Boss' });
    }
  }

  // ============ Combat Effects ============

  private updateShockwaves(currentTime: number): void {
    const player = this.entityManager.getPlayer();

    const playerDied = this.effectsSystem.updateShockwaves(
      {
        x: player.position.x,
        y: player.position.y,
        dodge: player.dodge,
        takeDamage: (damage: number, time: number) => player.takeDamage(damage, time),
      },
      currentTime,
      () => {
        EventBus.emit('playerDodged', undefined);
      },
    );

    if (playerDied) {
      // TODO: killed by, shockwave, maybe Killed by, could be displayed
      EventBus.emit('playerDeath', { player, killedBy: null });
    }
  }

  // ============ Render ============

  private render(): void {
    // Render effects
    this.renderSystem.renderAll(this.ctx, this.lastTime);
    // TODO: integrate EffectsSystem rendering into RenderSystem
    this.effectsSystem.renderAll(this.ctx);

    // Render boss health bar
    this.renderBossHealthBar();

    // Render enemy count (dev mode only, when enabled)
    if (this.showEnemyCount) {
      HUD.renderEnemyCount(this.ctx, this.entityManager.getActiveEnemyCount(), this.canvas.height);
    }
  }

  private renderBossHealthBar(): void {
    const enemies = this.entityManager.getActiveEnemies();
    // Map enemies to HUDBoss format
    const hudbosses = enemies.map((e) => ({
      type: e.type,
      hp: e.hp,
      maxHp: e.maxHp,
      isBoss: e.isBoss,
      bossName: e.bossName ?? undefined,
      hasTopHealthBar: false,
    }));
    HUD.renderBossHealthBar(this.ctx, this.canvas.width, hudbosses);
  }

  // ============ HUD ============

  private updateHUD(): void {
    const player = this.entityManager.getPlayer();

    // Emit HUD update for Preact UI
    EventBus.emit('hudUpdate', {
      hp: player.hp,
      maxHp: player.maxHp,
      gold: player.gold,
      xp: player.xp,
      armor: player.armor,
      damageMultiplier: player.damageMultiplier,
      critChance: player.critChance,
      dodge: player.dodge,
      regen: player.regen,
      waveNumber: this.waveManager.waveNumber,
      timeRemaining: this.waveManager.timeRemaining,
      isWaveActive: this.waveManager.isWaveActive,
    });
  }

  // ============ Shop ============

  private createShopPlayer(player: Player): ShopPlayer {
    const weapons = player.weapons;
    // Use a Proxy on the real player, only overriding what's needed for Shop
    return new Proxy(player as unknown as ShopPlayer, {
      get: (target, prop) => {
        // Override weapons to use ShopWeapon format with upgrade()
        if (prop === 'weapons') {
          return weapons.map((w: WeaponInstance) => this.createShopWeapon(w));
        }
        // Override addWeapon to call Game.addWeapon
        if (prop === 'addWeapon') {
          return (type: string) => {
            this.addWeapon(type as WeaponType);
          };
        }
        // Everything else comes from the real player
        return target[prop as keyof ShopPlayer];
      },
      set: (target, prop, value) => {
        // Forward all property sets directly to the real player
        (target as Record<string, unknown>)[prop as string] = value;
        return true;
      },
    });
  }

  private createShopWeapon(weapon: WeaponInstance): ShopWeapon {
    return {
      type: weapon.type,
      name: weapon.name,
      level: weapon.level,
      upgrade: () => {
        weapon.level++;
      },
      multishot: weapon.multishot,
    };
  }

  /**
   * Apply shop purchase effects to player.
   * Called when Preact Shop emits itemPurchased event.
   * Gold deduction is handled by RewardSystem.
   */
  private applyShopPurchase(itemId: string): void {
    const player = this.entityManager.getPlayer();
    const shopPlayer = this.createShopPlayer(player);

    // Use existing shop buyItem logic but skip the price check & event emission
    // since those are already handled
    this.shop.applyItemEffect(itemId, shopPlayer);
  }

  /**
   * Emit updated player state to Shop component after purchases
   */
  private emitShopPlayerUpdate(): void {
    const player = this.entityManager.getPlayer();
    EventBus.emit('shopPlayerUpdated', {
      gold: player.gold,
      weapons: player.weapons.map((w) => ({ type: w.type, name: w.name, level: w.level })),
      maxWeapons: player.maxWeapons,
      items: [...player.items],
    });
  }
}
