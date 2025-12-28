/**
 * Main Game Controller
 */
import { GAME_BALANCE } from '@/config/balance.config';
import { CHARACTER_TYPES } from '@/config/characters.config';
import { WeaponConfig } from '@/config/weapons.config';
import { EventBus } from '@/core/EventBus';
import { Deployable, DeployableConfig } from '@/entities/Deployable';
import { Enemy } from '@/entities/Enemy';
import { InputState, Player } from '@/entities/Player';
import { Projectile } from '@/entities/Projectile';
import { EntityManager } from '@/managers/EntityManager';
import { renderWeapons } from '@/rendering/WeaponRenderer';
import { AudioSystem } from '@/systems/AudioSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { createEffectsState, EffectsState, EffectsSystem } from '@/systems/EffectsSystem';
import { HUD } from '@/systems/HUD';
import { InputHandler } from '@/systems/InputHandler';
import { WaveManager } from '@/systems/WaveManager';
import {
  CharacterType,
  DeployableType,
  EnemyType,
  ProjectileType,
  VisualEffect,
  WeaponType,
} from '@/types/enums';
import { Leaderboard } from '@/ui/Leaderboard';
import { LeaderboardUI } from '@/ui/LeaderboardUI';
import { Shop, ShopPlayer, ShopWeapon } from '@/ui/Shop';
import { degreesToRadians, distance, randomChance, randomRange, vectorFromAngle } from '@/utils';

// ============ Types ============
export type GameState = 'start' | 'playing' | 'shop' | 'gameover' | 'paused';

// TODO move to separate file
// Weapon runtime instance (tracks cooldowns, levels)
export interface WeaponInstance {
  type: WeaponType;
  config: WeaponConfig;
  level: number;
  lastFireTime: number;
  multishot: number;
  name: string;
  fireOffset: number; // Staggered shooting offset
}

// ============ Game Class ============

export class Game {
  // Canvas
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Game state
  private state: GameState = 'start';
  private lastTime: number = 0;
  private selectedCharacter: CharacterType | null = null;

  // Entity Manager
  private entityManager: EntityManager;

  // Systems
  private collisionSystem: CollisionSystem;
  private combatSystem!: CombatSystem;
  private waveManager: WaveManager;
  private shop: Shop;
  private audio: AudioSystem;
  private leaderboard: Leaderboard;
  private leaderboardUI: LeaderboardUI;
  private inputHandler: InputHandler;

  // Effects
  private effects: EffectsState;

  // Resources
  private gold: number = 0;
  private xp: number = 0;

  // Regeneration tracking
  private lastRegenTime: number = 0;

  // Game loop tracking - prevents multiple loops
  private isGameLoopRunning: boolean = false;

  // Debug display options
  private showEnemyCount: boolean = false;

  // Dev menu (development only) - stored for potential future use
  // @ts-expect-error - stored for future use
  private _devMenu?: InstanceType<typeof import('@/debug/DevMenu').DevMenu>;

  public constructor() {
    // Get canvas
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = 900;
    this.canvas.height = 700;

    // Initialize systems
    this.entityManager = new EntityManager();
    this.collisionSystem = new CollisionSystem(this.entityManager);
    this.waveManager = new WaveManager();
    this.shop = new Shop();
    this.audio = new AudioSystem();
    this.leaderboard = new Leaderboard();
    this.leaderboardUI = new LeaderboardUI(this.leaderboard);
    this.inputHandler = new InputHandler({
      onPause: () => {
        this.pauseGame();
      },
      onResume: () => {
        this.resumeGame();
      },
      onSelectCharacter: (type: string) => {
        this.selectCharacter(type as CharacterType);
      },
      onRestart: () => {
        this.showCharacterSelect();
      },
      onStartWave: () => {
        this.startNextWave();
      },
      onQuitToMenu: () => {
        this.quitToMenu();
      },
      onToggleSound: () => {
        this.toggleSound();
      },
      onSubmitScore: () => {
        void this.submitScore();
      },
      onSwitchLeaderboardTab: (tab: string) => {
        this.switchLeaderboardTab(tab);
      },
      onOpenMenuLeaderboard: () => {
        void this.openMenuLeaderboard();
      },
      onCloseMenuLeaderboard: () => {
        this.closeMenuLeaderboard();
      },
      onSwitchMenuLeaderboardTab: (tab: string) => {
        this.switchMenuLeaderboardTab(tab);
      },
      getState: () => this.state,
    });
    this.effects = createEffectsState();

    // Initialize CombatSystem (requires effects)
    // TODO combatSystem should use Game_balance directly instead of passing values
    this.combatSystem = new CombatSystem(this.entityManager, this.effects, {
      healthDropChance: GAME_BALANCE.drops.healthDropChance,
      healthDropValue: GAME_BALANCE.drops.healthDropValue,
      healthDropLuckMultiplier: GAME_BALANCE.drops.healthDropLuckMultiplier,
    });

    // Setup EventBus listeners for combat events
    this.setupCombatEventListeners();

    // Setup input handler
    this.inputHandler.setup();

    // Setup shop callbacks
    this.shop.setCallbacks({
      getGold: () => this.gold,
      setGold: (value: number) => {
        this.gold = value;
      },
      getWaveNumber: () => this.waveManager.waveNumber,
      showNotification: (message: string) => {
        this.showNotification(message);
      },
      updateHUD: () => {
        this.updateHUD();
      },
    });

    // Bind to window for global access
    (window as unknown as { game: Game }).game = this;

    // Initialize dev menu (development only)
    if (import.meta.env.DEV) {
      void this.initDevMenu();
    }
  }

  /**
   * Initialize dev menu with dependency injection
   */
  private async initDevMenu(): Promise<void> {
    const { DevMenu } = await import('@/debug/DevMenu');
    this._devMenu = new DevMenu({
      // State
      getState: () => this.state,
      getGold: () => this.gold,
      setGold: (value) => {
        this.gold = value;
      },
      getCanvasSize: () => ({ width: this.canvas.width, height: this.canvas.height }),

      // Debug display options
      setShowEnemyCount: (show) => {
        this.showEnemyCount = show;
      },

      // Game control
      pauseGame: () => {
        this.pauseGame();
      },
      resumeGame: () => {
        this.resumeGame();
      },

      // Wave control
      getCurrentWave: () => this.waveManager.currentWave,
      skipToWave: (wave) => {
        this.waveManager.skipToWave(wave);
      },

      // Player actions
      getPlayer: () => {
        const player = this.entityManager.getPlayer();
        if (!player) return null;
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

  // ============ Setup ============

  private showNotification(message: string): void {
    console.log('Notification:', message);
    // TODO: Implement visual notification
  }

  // ============ Leaderboard Methods ============

  private async openMenuLeaderboard(): Promise<void> {
    await this.leaderboardUI.openMenuLeaderboard();
  }

  private closeMenuLeaderboard(): void {
    this.leaderboardUI.closeMenuLeaderboard();
  }

  // TODO: remove if not needed
  // @ts-expect-error - kept for potential future use
  private async _showMenuLeaderboard(tab: string = 'local'): Promise<void> {
    await this.leaderboardUI.showMenuLeaderboard(tab);
  }

  private switchMenuLeaderboardTab(tab: string): void {
    this.leaderboardUI.switchMenuLeaderboardTab(tab);
  }

  private async submitScore(): Promise<void> {
    await this.leaderboardUI.submitScore(
      this.waveManager.waveNumber,
      this.xp,
      this.selectedCharacter,
    );
  }

  private async showLeaderboard(
    tab: string = 'local',
    highlightName: string | null = null,
  ): Promise<void> {
    await this.leaderboardUI.showLeaderboard(tab, highlightName);
  }

  private switchLeaderboardTab(tab: string): void {
    this.leaderboardUI.switchLeaderboardTab(tab);
  }

  // ============ Character Selection ============

  private selectCharacter(characterType: CharacterType): void {
    // Prevent multiple game starts from rapid clicking
    if (this.state !== 'start') return;
    this.state = 'playing';

    this.selectedCharacter = characterType;

    // Mark selected card
    document.querySelectorAll('.character-card').forEach((card) => {
      card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-character="${characterType}"]`);
    if (selectedCard) selectedCard.classList.add('selected');

    this.startGame();
  }

  private showCharacterSelect(): void {
    this.state = 'start';
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('start-screen')?.classList.remove('hidden');
    document.querySelectorAll('.character-card').forEach((card) => {
      card.classList.remove('selected');
    });
    this.selectedCharacter = null;

    // Reset score submit form
    const scoreSubmit = document.getElementById('score-submit');
    if (scoreSubmit) scoreSubmit.style.display = 'flex';
    const submitBtn = document.getElementById('submit-score-btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '📊 Zapisz wynik';
    }
  }

  private toggleSound(): void {
    this.audio.toggle();
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.textContent = this.audio.isEnabled() ? '🔊 Dźwięk: WŁ' : '🔇 Dźwięk: WYŁ';
    }
  }

  // ============ Pause Menu ============

  private pauseGame(): void {
    this.state = 'paused';
    document.getElementById('pause-menu')?.classList.remove('hidden');
  }

  private resumeGame(): void {
    this.state = 'playing';
    document.getElementById('pause-menu')?.classList.add('hidden');
    this.startGameLoop();
  }

  private quitToMenu(): void {
    this.state = 'start';
    document.getElementById('pause-menu')?.classList.add('hidden');
    this.showCharacterSelect();
  }

  // ============ Game Start ============

  private startGame(): void {
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
    this.gold = 0;
    this.xp = 0;
    this.effects = createEffectsState();
    this.waveManager = new WaveManager();

    // Reset CombatSystem with fresh effects
    this.combatSystem = new CombatSystem(this.entityManager, this.effects, {
      healthDropChance: GAME_BALANCE.drops.healthDropChance,
      healthDropValue: GAME_BALANCE.drops.healthDropValue,
      healthDropLuckMultiplier: GAME_BALANCE.drops.healthDropLuckMultiplier,
    });

    // Hide overlays
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('shop')?.classList.add('hidden');

    this.state = 'playing';
    this.waveManager.startWave();
    this.updateHUD();

    // Start game loop
    this.startGameLoop();
  }

  private startNextWave(): void {
    this.shop.hideShop();
    this.state = 'playing';

    const player = this.entityManager.getPlayer();
    if (player) {
      player.hp = player.maxHp;
      // Reset player position to center
      player.position.x = this.canvas.width / 2;
      player.position.y = this.canvas.height / 2;
    }

    // Clear entities except player
    this.entityManager.clearExceptPlayer();

    this.waveManager.startWave();
  }

  // ============ Weapon Management ============

  private addWeapon(type: WeaponType): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

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
    if (!player) return;

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

    if (this.state === 'playing') {
      this.update(deltaTime, timestamp);
    }

    this.render();

    // Continue loop only for active game states
    if (this.state === 'playing' || this.state === 'shop') {
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
    if (!player) return;

    const deltaSeconds = deltaTime / 1000;

    // Get input state from InputHandler
    const keys = this.inputHandler.getKeys();
    const input: InputState = {
      up: keys.w === true || keys.arrowup === true,
      down: keys.s === true || keys.arrowdown === true,
      left: keys.a === true || keys.arrowleft === true,
      right: keys.d === true || keys.arrowright === true,
    };

    // Update player movement
    player.updateMovement(input, this.canvas.width, this.canvas.height, deltaSeconds);

    // Regeneration
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
      this.openShop();
      return;
    }

    // Update CombatSystem runtime config with current player stats
    this.combatSystem.updateRuntimeConfig({
      luck: player.luck,
      goldMultiplier: player.goldMultiplier,
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
                radius: 6,
                type: ProjectileType.ENEMY_BULLET,
                damage: bulletData.damage,
                ownerId: enemy.id,
                color: bulletData.color,
                maxDistance: 1000,
              });
              projectile.setVelocity(bulletData.vx, bulletData.vy);
              this.entityManager.addProjectile(projectile);
            }
          } else if (attackResult.type === 'shockwave') {
            EffectsSystem.createShockwave(this.effects, attackResult);
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

      // Magnet attraction - move towards player if in range
      const distToPlayer = distance(pickup.position, player.position);
      if (distToPlayer < player.pickupRange || pickup.isAttracted) {
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

    this.updateHUD();
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
      const maxRange = (config.range ?? 300) * player.attackRange;

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
      const projectileCount = (config.bulletCount ?? 1) + weapon.multishot + player.projectileCount;

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
    this.playWeaponSound(weapon.type);
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

  private playWeaponSound(type: WeaponType): void {
    EventBus.emit('weaponFired', { weaponType: type });
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
      position: player.position,
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
    if (!player) return;

    const playerDied = EffectsSystem.updateShockwaves(
      this.effects,
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

    if (playerDied) this.gameOver();
  }

  // ============ Render ============

  private render(): void {
    // Clear
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid pattern
    this.ctx.strokeStyle = '#1a2744';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Render effects
    EffectsSystem.renderAll(this.ctx, this.effects);

    // Render pickups
    for (const pickup of this.entityManager.getActivePickups()) {
      pickup.draw(this.ctx);
    }

    // Render deployables
    for (const deployable of this.entityManager.getActiveDeployables()) {
      deployable.draw(this.ctx);
    }

    // Render projectiles
    for (const projectile of this.entityManager.getActiveProjectiles()) {
      projectile.draw(this.ctx);
    }

    // Render enemies
    for (const enemy of this.entityManager.getActiveEnemies()) {
      enemy.draw(this.ctx);
    }

    // Render player
    const player = this.entityManager.getPlayer();
    if (player) {
      player.draw(this.ctx, this.lastTime);

      // Render weapons around player
      renderWeapons(this.ctx, player);
    }

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
    if (!player) return;
    HUD.update(player, this.waveManager, this.gold, this.xp);
  }

  // ============ Shop ============

  private openShop(): void {
    this.state = 'shop';
    this.waveManager.endWave();
    this.entityManager.clearExceptPlayer();
    this.shop.resetReroll();

    const player = this.entityManager.getPlayer();
    if (player) {
      // Create shop-compatible player wrapper
      const shopPlayer = this.createShopPlayer(player);
      this.shop.generateItems(shopPlayer);
      this.shop.renderShop(this.gold, shopPlayer);
    }
  }

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

  // ============ Combat Event Listeners ============

  /**
   * Setup EventBus listeners for combat events from CombatSystem
   */
  private setupCombatEventListeners(): void {
    // Handle gold collection from CombatSystem
    EventBus.on('goldCollected', ({ amount }) => {
      this.gold += amount;
    });

    // Handle XP awards
    EventBus.on('xpAwarded', ({ amount }) => {
      this.xp += amount;
    });

    // Handle player death
    EventBus.on('playerDeath', () => {
      this.gameOver();
    });
  }

  // ============ Game Over ============

  private gameOver(): void {
    this.state = 'gameover';
    // gameOver sound is played via EventBus listener
    EventBus.emit('gameOver', {
      score: this.xp,
      wave: this.waveManager.waveNumber,
      time: 0,
    });

    const finalWave = document.getElementById('final-wave');
    const finalXp = document.getElementById('final-xp');
    if (finalWave) finalWave.textContent = String(this.waveManager.waveNumber);
    if (finalXp) finalXp.textContent = String(this.xp);
    document.getElementById('game-over')?.classList.remove('hidden');

    // Load saved player name
    const savedName = localStorage.getItem('circle_survivor_player_name') ?? '';
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    playerNameInput.value = savedName;

    // Show leaderboard
    void this.showLeaderboard('local');
  }
}
