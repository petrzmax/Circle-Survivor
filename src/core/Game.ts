/**
 * Main Game Controller
 * Uses new TypeScript architecture with EntityManager and Systems.
 * Preserves all game mechanics, values and visual appearance from original.
 */

import { Player, InputState } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Deployable, DeployableConfig } from '@/entities/Deployable';
import { createGoldPickup, createHealthPickup } from '@/entities/Pickup';
import { EntityManager } from '@/managers/EntityManager';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { WaveManager } from '@/systems/WaveManager';
import { Shop, ShopPlayer, ShopWeapon } from '@/ui/Shop';
import { InputHandler, KeyState } from '@/systems/InputHandler';
import { HUD } from '@/systems/HUD';
import { EffectsSystem, EffectsState, createEffectsState } from '@/systems/EffectsSystem';
import { WeaponRenderer } from '@/systems/WeaponRenderer';
import { AudioSystem } from '@/systems/AudioSystem';
import { LeaderboardUI } from '@/ui/LeaderboardUI';
import { Leaderboard } from '@/ui/Leaderboard';
import { EventBus } from '@/core/EventBus';
import { CHARACTER_TYPES } from '@/config/characters.config';
import { WEAPON_TYPES, WeaponConfig } from '@/config/weapons.config';
import { GAME_BALANCE } from '@/config/balance.config';
import {
  CharacterType,
  WeaponType,
  ProjectileType,
  EnemyType,
  PickupType,
  VisualEffect,
  DeployableType,
} from '@/types/enums';
import { circleCollision, distance } from '@/utils';

// ============ Types ============

export type GameState = 'start' | 'playing' | 'shop' | 'gameover' | 'paused';

// Weapon runtime instance (tracks cooldowns, levels)
interface WeaponInstance {
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

  // Weapon instances (runtime state)
  private weapons: WeaponInstance[] = [];

  // Systems
  private collisionSystem: CollisionSystem;
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
      onPause: () => { this.pauseGame(); },
      onResume: () => { this.resumeGame(); },
      onSelectCharacter: (type: string) => { this.selectCharacter(type as CharacterType); },
      onRestart: () => { this.showCharacterSelect(); },
      onStartWave: () => { this.startNextWave(); },
      onQuitToMenu: () => { this.quitToMenu(); },
      onToggleSound: () => { this.toggleSound(); },
      onSubmitScore: () => { void this.submitScore(); },
      onSwitchLeaderboardTab: (tab: string) => { this.switchLeaderboardTab(tab); },
      onOpenMenuLeaderboard: () => { void this.openMenuLeaderboard(); },
      onCloseMenuLeaderboard: () => { this.closeMenuLeaderboard(); },
      onSwitchMenuLeaderboardTab: (tab: string) => { this.switchMenuLeaderboardTab(tab); },
      getState: () => this.state,
    });
    this.effects = createEffectsState();

    // Setup input handler
    this.inputHandler.setup();

    // Setup shop callbacks
    this.shop.setCallbacks({
      getGold: () => this.gold,
      setGold: (value: number) => {
        this.gold = value;
      },
      getWaveNumber: () => this.waveManager.waveNumber,
      playPurchaseSound: () => { this.audio.purchase(); },
      playErrorSound: () => { this.audio.error(); },
      showNotification: (message: string) => { this.showNotification(message); },
      updateHUD: () => { this.updateHUD(); },
    });

    // Bind to window for global access
    (window as unknown as { game: Game }).game = this;

    this.setupEventBusListeners();

    // Initialize dev menu (development only)
    if (import.meta.env.DEV) {
      this.initDevMenu();
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
      pauseGame: () => { this.pauseGame(); },
      resumeGame: () => { this.resumeGame(); },

      // Wave control
      getCurrentWave: () => this.waveManager.currentWave,
      skipToWave: (wave) => { this.waveManager.skipToWave(wave); },

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
          heal: (amount) => { player.heal(amount); },
          addItem: (itemId) => { player.addItem(itemId); },
          applyStat: (stat, value) =>
            { player.applyStat(stat as keyof import('@/entities/Player').PlayerStats, value); },
        };
      },

      // Entity actions
      addWeapon: (type) => { this.addWeapon(type); },
      spawnEnemy: (type, x, y) => { this.spawnEnemy(type, x, y); },
      killAllEnemies: () => { this.killAllEnemies(); },
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

  private setupEventBusListeners(): void {
    EventBus.on('enemyDeath', ({ enemy }) => {
      this.handleEnemyDeath(enemy);
    });
  }

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

  private async showMenuLeaderboard(tab: string = 'local'): Promise<void> {
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

  private async showLeaderboard(tab: string = 'local', highlightName: string | null = null): Promise<void> {
    await this.leaderboardUI.showLeaderboard(tab, highlightName);
  }

  private switchLeaderboardTab(tab: string): void {
    this.leaderboardUI.switchLeaderboardTab(tab);
  }

  // ============ Character Selection ============

  private selectCharacter(characterType: CharacterType): void {
    this.selectedCharacter = characterType;

    // Mark selected card
    document.querySelectorAll('.character-card').forEach((card) => {
      card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-character="${characterType}"]`);
    if (selectedCard) selectedCard.classList.add('selected');

    // Start game after short delay
    setTimeout(() => { this.startGame(); }, 300);
  }

  private showCharacterSelect(): void {
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
    this.lastTime = performance.now();
    requestAnimationFrame((t) => { this.gameLoop(t); });
  }

  private quitToMenu(): void {
    this.state = 'start';
    document.getElementById('pause-menu')?.classList.add('hidden');
    this.showCharacterSelect();
  }

  // ============ Game Start ============

  private startGame(): void {
    this.selectedCharacter ??= CharacterType.NORMIK;

    // Initialize audio
    this.audio.init();
    this.audio.connectToEventBus();

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
    this.weapons = [];
    this.addWeapon(charConfig.startingWeapon);

    // Reset game state
    this.gold = 0;
    this.xp = 0;
    this.effects = createEffectsState();
    this.waveManager = new WaveManager();

    // Hide overlays
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('game-over')?.classList.add('hidden');
    document.getElementById('shop')?.classList.add('hidden');

    this.state = 'playing';
    this.waveManager.startWave();
    this.audio.waveStart();
    this.updateHUD();

    // Start game loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => { this.gameLoop(t); });
  }

  private startNextWave(): void {
    this.shop.hideShop();
    this.state = 'playing';

    const player = this.entityManager.getPlayer();
    if (player) {
      player.hp = player.maxHp;
      // Reset player position to center
      player.x = this.canvas.width / 2;
      player.y = this.canvas.height / 2;
    }

    // Clear entities except player
    this.entityManager.clearExceptPlayer();

    this.waveManager.startWave();
    this.audio.waveStart();
  }

  // ============ Weapon Management ============

  private addWeapon(type: WeaponType): void {
    const config = WEAPON_TYPES[type];
    if (!config) return;

    const player = this.entityManager.getPlayer();
    if (player && player.weaponTypes.length >= player.maxWeapons) {
      // Check if we already have this weapon - upgrade it
      const existing = this.weapons.find((w) => w.type === type);
      if (existing) {
        existing.level++;
        return;
      }
      return;
    }

    player?.addWeapon(type);
    this.weapons.push({
      type,
      config,
      level: 1,
      lastFireTime: 0,
      multishot: 0, // Extra projectiles from items (not base bulletCount)
      name: config.name,
      fireOffset: 0,
    });

    // Recalculate fire offsets for staggered shooting
    this.recalculateFireOffsets();
  }

  /**
   * Spread shots evenly for weapons of the same type.
   * Assigns staggered offsets so weapons don't all fire at once.
   */
  private recalculateFireOffsets(): void {
    // Group weapons by type
    const weaponsByType: Record<string, WeaponInstance[]> = {};
    for (const weapon of this.weapons) {
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

    if (this.state !== 'gameover' && this.state !== 'paused') {
      requestAnimationFrame((t) => { this.gameLoop(t); });
    }
  }

  // ============ Update ============

  private update(deltaTime: number, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

    const deltaSeconds = deltaTime / 1000;

    // Get input state from InputHandler
    const keys = this.inputHandler.getKeys();
    const input: InputState = {
      up: (keys.w ?? keys.arrowup) ?? false,
      down: (keys.s ?? keys.arrowdown) ?? false,
      left: (keys.a ?? keys.arrowleft) ?? false,
      right: (keys.d ?? keys.arrowright) ?? false,
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
      this.audio.countdownTick(waveResult.countdown);
    }

    if (waveResult.waveEnded) {
      this.openShop();
      return;
    }

    // Find nearest enemy for auto-aim
    const nearestEnemy = this.entityManager.getNearestEnemy(player.x, player.y);
    player.setTarget(nearestEnemy ? { x: nearestEnemy.x, y: nearestEnemy.y } : null);

    // Fire weapons
    this.fireWeapons(currentTime, player);

    // Update enemies
    const enemies = this.entityManager.getActiveEnemies();
    for (const enemy of enemies) {
      enemy.update(deltaSeconds);
      enemy.moveTowardsTarget(player, deltaSeconds, this.canvas.width, this.canvas.height);

      // Check collision with player
      if (circleCollision(enemy, player)) {
        // Dodge chance
        if (player.dodge > 0 && Math.random() < player.dodge) {
          this.audio.dodge();
          continue;
        }

        // Boss damage multiplier
        let damage = enemy.damage;
        if (enemy.isBoss) {
          damage *= GAME_BALANCE.boss.contactDamageMultiplier;
        }

        const isDead = player.takeDamage(damage, currentTime);
        this.audio.playerHit();

        // Thorns
        if (player.thorns > 0) {
          this.audio.thorns();
          const thornsKilled = enemy.takeDamage(player.thorns, enemy.x, enemy.y, player.knockback);
          if (thornsKilled) {
            this.handleEnemyDeath(enemy);
          }
        }

        if (isDead) {
          this.gameOver();
          return;
        }
      }

      // Boss shooting
      if (enemy.canShoot) {
        const attackResult = enemy.tryAttack(player, currentTime);
        if (attackResult) {
          if (attackResult.type === 'bullets') {
            // Create enemy projectiles
            for (const bulletData of attackResult.bullets) {
              const projectile = new Projectile({
                x: bulletData.x,
                y: bulletData.y,
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

    // Update projectiles
    const projectiles = this.entityManager.getActiveProjectiles();
    const playerId = player.id;

    for (const projectile of projectiles) {
      projectile.update(deltaSeconds);

      // Remove expired - but check if grenade should explode first
      if (!projectile.isActive) {
        // Grenades explode when they reach their target distance
        if (projectile.shouldExplodeOnExpire && projectile.isExplosive() && projectile.explosive) {
          const expRadius = projectile.explosive.explosionRadius * player.explosionRadius;
          const isMini = projectile.type === ProjectileType.MINI_BANANA;
          this.handleExplosion(
            projectile.x,
            projectile.y,
            expRadius,
            projectile.damage * player.damageMultiplier,
            projectile.explosive.visualEffect,
            isMini,
          );
        }
        this.entityManager.removeProjectile(projectile.id);
        continue;
      }

      // Off screen check
      if (
        projectile.x < -50 ||
        projectile.x > this.canvas.width + 50 ||
        projectile.y < -50 ||
        projectile.y > this.canvas.height + 50
      ) {
        projectile.destroy();
        continue;
      }

      // Enemy projectile -> player collision
      if (projectile.ownerId !== playerId) {
        if (circleCollision(projectile, player)) {
          if (player.dodge > 0 && Math.random() < player.dodge) {
            this.audio.dodge();
            projectile.destroy();
            continue;
          }

          const isDead = player.takeDamage(projectile.damage, currentTime);
          this.audio.playerHit();
          projectile.destroy();

          if (isDead) {
            this.gameOver();
            return;
          }
        }
      } else {
        // Player projectile -> enemy collision
        for (const enemy of enemies) {
          // Skip already hit (pierce)
          if (projectile.pierce?.hitEnemies.has(enemy.id)) continue;

          if (circleCollision(projectile, enemy)) {
            // Explosive
            if (projectile.isExplosive() && projectile.explosive) {
              const expRadius = projectile.explosive.explosionRadius * player.explosionRadius;
              const isMini = projectile.type === ProjectileType.MINI_BANANA;
              this.handleExplosion(
                projectile.x,
                projectile.y,
                expRadius,
                projectile.damage * player.damageMultiplier,
                projectile.explosive.visualEffect,
                isMini,
              );
              projectile.destroy();
              break;
            }

            const finalDamage = projectile.damage * player.damageMultiplier;
            const isDead = enemy.takeDamage(
              finalDamage,
              projectile.x,
              projectile.y,
              player.knockback * projectile.knockbackMultiplier,
            );

            // Chain effect
            if (projectile.canChain() && projectile.chain) {
              this.handleChainEffect(
                enemy.x,
                enemy.y,
                finalDamage * 0.5,
                projectile.chain.chainCount,
              );
            }

            // Lifesteal
            if (player.lifesteal > 0) {
              player.heal(finalDamage * player.lifesteal);
            }

            if (projectile.canPierce()) {
              projectile.registerHit(enemy.id);
            } else {
              projectile.destroy();
            }

            if (isDead) {
              this.handleEnemyDeath(enemy);
            }

            if (!projectile.isActive) break;
          }
        }
      }
    }

    // Update deployables (mines)
    const deployables = this.entityManager.getActiveDeployables();
    for (const deployable of deployables) {
      deployable.update(deltaSeconds);

      if (deployable.isArmed) {
        // Check for enemies in trigger radius
        const nearbyEnemies = this.entityManager.getEnemiesInRadius(
          deployable.x,
          deployable.y,
          deployable.triggerRadius,
        );
        if (nearbyEnemies.length > 0) {
          const explosionData = deployable.trigger();
          if (explosionData) {
            this.handleExplosion(
              deployable.x,
              deployable.y,
              explosionData.explosionRadius,
              explosionData.explosionDamage,
              deployable.visualEffect,
            );
          }
        }
      }
    }

    // Update pickups
    const pickups = this.entityManager.getActivePickups();
    for (const pickup of pickups) {
      pickup.update(deltaSeconds);

      if (!pickup.isActive) continue;

      // Check collection (magnet effect)
      const distToPlayer = distance(pickup, player);
      if (distToPlayer < player.pickupRange || pickup.isAttracted) {
        pickup.isAttracted = true;
        // Move towards player
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const magnetSpeed = 5;
          pickup.x += (dx / dist) * magnetSpeed;
          pickup.y += (dy / dist) * magnetSpeed;
        }
      }

      // Collect when touching player
      if (distToPlayer < player.radius) {
        if (pickup.type === PickupType.GOLD) {
          this.gold += Math.floor(pickup.value * player.goldMultiplier);
          this.audio.collectGold();
        } else if (pickup.type === PickupType.HEALTH) {
          player.heal(pickup.value);
          this.audio.collectHealth();
        }
        pickup.destroy();
      }
    }

    // Update shockwaves
    this.updateShockwaves(currentTime);

    // Cleanup
    this.entityManager.removeInactive();

    this.updateHUD();
  }

  // ============ Weapon Firing ============

  private fireWeapons(currentTime: number, player: Player): void {
    for (let i = 0; i < this.weapons.length; i++) {
      const weapon = this.weapons[i]!;
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

      // Find nearest enemy from weapon position
      let target = this.entityManager.getNearestEnemy(weaponPos.x, weaponPos.y, maxRange);

      // Fallback to main target if within range
      if (!target && player.currentTarget) {
        const dx = player.currentTarget.x - weaponPos.x;
        const dy = player.currentTarget.y - weaponPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= maxRange) {
          // Find the actual enemy at currentTarget position
          target = this.entityManager.getNearestEnemy(
            player.currentTarget.x,
            player.currentTarget.y,
            50,
          );
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
    const targetAngle = Math.atan2(target.y - pos.y, target.x - pos.x);

    // Critical hit check
    const isCrit = Math.random() < player.critChance;
    const finalDamage = isCrit ? damage * player.critDamage : damage;

    for (let i = 0; i < projectileCount; i++) {
      // Spread angle for multiple projectiles (spread is in degrees)
      let angle = targetAngle;
      if (projectileCount > 1) {
        // Convert spread from degrees to radians
        const spreadRad = ((config.spread ?? 0) * Math.PI) / 180;
        // Distribute bullets evenly across spread
        angle = targetAngle - spreadRad / 2 + (spreadRad / (projectileCount - 1)) * i;
      } else if ((config.spread ?? 0) > 0) {
        // Random spread for single bullet
        const spreadRad = ((Math.random() - 0.5) * (config.spread ?? 0) * Math.PI) / 180;
        angle += spreadRad;
      }

      const speed = config.bulletSpeed ?? 10;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const projectile = new Projectile({
        x: pos.x,
        y: pos.y,
        radius: config.bulletRadius ?? 4, // Default 4 like original
        type: this.getProjectileType(weapon.type),
        damage: finalDamage,
        ownerId: player.id,
        color: config.color ?? '#ffff00',
        maxDistance: config.shortRange ? (config.maxDistance ?? config.range ?? 500) : 0, // 0 = infinite
        pierce: config.pierce
          ? { pierceCount: (config.pierceCount ?? 1) + player.pierce, hitEnemies: new Set() }
          : undefined,
        chain: config.chain
          ? { chainCount: config.chainCount ?? 3, chainRange: 150, chainedEnemies: new Set() }
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

      projectile.setVelocity(vx, vy);
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
    switch (type) {
      case WeaponType.SHOTGUN:
        this.audio.shootShotgun();
        break;
      case WeaponType.SNIPER:
        this.audio.shootSniper();
        break;
      case WeaponType.LASER:
        this.audio.shootLaser();
        break;
      case WeaponType.MINIGUN:
        this.audio.shootMinigun();
        break;
      case WeaponType.FLAMETHROWER:
        this.audio.flamethrower();
        break;
      case WeaponType.SCYTHE:
        this.audio.scytheSwing();
        break;
      case WeaponType.SWORD:
        this.audio.swordSlash();
        break;
      case WeaponType.CROSSBOW:
        this.audio.crossbowShoot();
        break;
      case WeaponType.BAZOOKA:
      case WeaponType.NUKE:
      case WeaponType.HOLY_GRENADE:
      case WeaponType.BANANA:
        // Explosion plays on hit, not on shot
        this.audio.shoot();
        break;
      default:
        this.audio.shoot();
    }
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
      x: player.x,
      y: player.y,
      radius: config.bulletRadius ?? 12,
      type: DeployableType.MINE,
      damage: damage,
      ownerId: player.id,
      color: config.color ?? '#333333',
      explosionRadius: (config.explosionRadius ?? 70) * player.explosionRadius,
      explosionDamage: damage,
      visualEffect: VisualEffect.STANDARD,
      armingTime: 0.5, // 500ms arming time like original
    };

    const mine = new Deployable(deployableConfig);
    this.entityManager.addDeployable(mine);

    // Play mine deploy sound (reuse bomb sound)
    this.audio.explosion(); // TODO: Add proper mine deploy sound
  }

  // ============ Dev Tools ============

  /**
   * Spawn enemy at position (used by DevMenu)
   * TODO: When SpawnSystem is fully integrated, delegate to SpawnSystem.spawnEnemyAt()
   */
  private spawnEnemy(type: EnemyType, x: number, y: number): void {
    const enemy = new Enemy({ x, y, type });
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
        x: player.x,
        y: player.y,
        dodge: player.dodge,
        takeDamage: (damage: number, time: number) => player.takeDamage(damage, time),
      },
      currentTime,
      () => { this.audio.dodge(); },
    );

    if (playerDied) this.gameOver();
  }

  private handleEnemyDeath(enemy: Enemy): void {
    // Create death effect
    EffectsSystem.createDeathEffect(this.effects, {
      x: enemy.x,
      y: enemy.y,
      color: enemy.color,
      isBoss: enemy.isBoss,
      type: enemy.type,
    });

    // Award XP
    this.xp += enemy.xpValue;

    // Drop gold - bosses drop multiple bags for satisfying effect
    const player = this.entityManager.getPlayer();
    const luck = player?.luck ?? 0;

    if (enemy.isBoss) {
      // One large bag (50% of value) in center
      const bigPickup = createGoldPickup(enemy.x, enemy.y, Math.floor(enemy.goldValue * 0.5));
      this.entityManager.addPickup(bigPickup);

      // 6-8 small bags scattered around
      const smallBags = 6 + Math.floor(Math.random() * 3);
      const smallValue = Math.floor((enemy.goldValue * 0.5) / smallBags);
      for (let i = 0; i < smallBags; i++) {
        const angle = ((Math.PI * 2) / smallBags) * i;
        const dist = 20 + Math.random() * 30;
        const smallPickup = createGoldPickup(
          enemy.x + Math.cos(angle) * dist,
          enemy.y + Math.sin(angle) * dist,
          smallValue,
        );
        this.entityManager.addPickup(smallPickup);
      }
    } else {
      // Normal enemy - one bag with random offset
      const goldOffsetX = (Math.random() - 0.5) * 20;
      const goldOffsetY = (Math.random() - 0.5) * 20;
      const goldPickup = createGoldPickup(
        enemy.x + goldOffsetX,
        enemy.y + goldOffsetY,
        enemy.goldValue,
      );
      this.entityManager.addPickup(goldPickup);
    }

    // Bonus gold from luck
    if (luck > 0 && Math.random() < luck) {
      const bonusOffsetX = (Math.random() - 0.5) * 30;
      const bonusOffsetY = (Math.random() - 0.5) * 30;
      const bonusPickup = createGoldPickup(
        enemy.x + bonusOffsetX,
        enemy.y + bonusOffsetY,
        Math.floor(enemy.goldValue * 0.5),
      );
      this.entityManager.addPickup(bonusPickup);
    }

    // Chance for health drop (15% base + luck bonus)
    const healthDropChance =
      GAME_BALANCE.drops.healthDropChance + luck * GAME_BALANCE.drops.healthDropLuckMultiplier;
    if (Math.random() < healthDropChance) {
      const healthPickup = createHealthPickup(
        enemy.x + 20,
        enemy.y,
        GAME_BALANCE.drops.healthDropValue,
      );
      this.entityManager.addPickup(healthPickup);
    }

    // Play sound - boss uses nuke explosion, regular enemies use death sound
    if (enemy.isBoss) {
      this.audio.nukeExplosion();
    } else {
      this.audio.enemyDeath();
    }

    // Handle special death effects
    if (enemy.explodeOnDeath) {
      this.handleExplosion(enemy.x, enemy.y, enemy.explosionRadius, enemy.explosionDamage);
    }

    if (enemy.splitOnDeath) {
      this.spawnSplitEnemies(enemy);
    }

    // Remove from manager
    enemy.destroy();
  }

  private spawnSplitEnemies(enemy: Enemy): void {
    const splitType = enemy.type === EnemyType.SPLITTER ? 'swarm' : 'basic';
    for (let i = 0; i < enemy.splitCount; i++) {
      const angle = (Math.PI * 2 * i) / enemy.splitCount;
      const offsetX = Math.cos(angle) * 30;
      const offsetY = Math.sin(angle) * 30;

      const splitEnemy = new Enemy({
        x: enemy.x + offsetX,
        y: enemy.y + offsetY,
        type: splitType as EnemyType,
        scale: 0.6,
      });

      this.entityManager.addEnemy(splitEnemy);
    }
  }

  private handleExplosion(
    x: number,
    y: number,
    radius: number,
    damage: number,
    visualEffect: VisualEffect = VisualEffect.STANDARD,
    isMini: boolean = false,
  ): void {
    const player = this.entityManager.getPlayer();
    const damageMultiplier = player?.damageMultiplier ?? 1;

    // Determine explosion type flags
    const isNuke = visualEffect === VisualEffect.NUKE;
    const isHolyGrenade = visualEffect === VisualEffect.HOLY;
    const isBanana = visualEffect === VisualEffect.BANANA;

    // Create visual with correct type
    EffectsSystem.createExplosion(this.effects, x, y, radius, isNuke, isHolyGrenade, isBanana);

    // Banana (not mini) spawns mini bananas
    if (isBanana && !isMini && player) {
      this.spawnMiniBananas(x, y, 4 + Math.floor(Math.random() * 3), player);
    }

    // Damage enemies in radius
    const enemies = this.entityManager.getEnemiesInRadius(x, y, radius);
    for (const enemy of enemies) {
      const isDead = enemy.takeDamage(damage * damageMultiplier, x, y);
      if (isDead) {
        this.handleEnemyDeath(enemy);
      }
    }

    // Play correct explosion sound
    if (isNuke) {
      this.audio.nukeExplosion();
    } else if (isHolyGrenade) {
      this.audio.holyExplosion();
    } else {
      this.audio.explosion();
    }
  }

  /**
   * Spawn mini bananas after main banana explosion
   */
  private spawnMiniBananas(x: number, y: number, count: number, player: Player): void {
    const config = WEAPON_TYPES.minibanana;

    for (let i = 0; i < count; i++) {
      // Spread evenly with some randomness
      const angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.5;

      // Random speed (6-10) and range (60-100px) for each mini banana
      const randomSpeed = 6 + Math.random() * 4;
      const randomRange = 60 + Math.random() * 40;

      const vx = Math.cos(angle) * randomSpeed;
      const vy = Math.sin(angle) * randomSpeed;

      const projectile = new Projectile({
        x,
        y,
        radius: config.bulletRadius ?? 6,
        type: ProjectileType.MINI_BANANA,
        damage: config.damage * player.damageMultiplier,
        ownerId: player.id,
        color: config.color ?? '#ffff00',
        explosive: {
          explosionRadius: (config.explosionRadius ?? 45) * player.explosionRadius,
          explosionDamage: config.damage * player.damageMultiplier,
          visualEffect: VisualEffect.BANANA,
        },
        weaponCategory: config.weaponCategory,
        explosiveRange: randomRange,
        bulletSpeed: randomSpeed,
      });

      projectile.setVelocity(vx, vy);

      this.entityManager.addProjectile(projectile);
    }
  }

  private handleChainEffect(startX: number, startY: number, damage: number, chainCount: number): void {
    let currentX = startX;
    let currentY = startY;
    let remainingChains = chainCount;
    let currentDamage = damage;
    const hitEnemies = new Set<number>();

    while (remainingChains > 0) {
      const enemies = this.entityManager.getActiveEnemies().filter((e) => !hitEnemies.has(e.id));

      let nearest: Enemy | null = null;
      let nearestDist = 150;

      for (const enemy of enemies) {
        const dist = distance({ x: currentX, y: currentY }, enemy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }

      if (!nearest) break;

      hitEnemies.add(nearest.id);

      // Create chain visual
      EffectsSystem.createChainEffect(this.effects, currentX, currentY, nearest.x, nearest.y);

      // Damage
      currentDamage *= 0.8;
      const isDead = nearest.takeDamage(currentDamage, currentX, currentY);
      if (isDead) {
        this.handleEnemyDeath(nearest);
      }

      currentX = nearest.x;
      currentY = nearest.y;
      remainingChains--;
    }

    this.audio.chainEffect();
  }

  // ============ Enemy Finding ============

   private findNearestEnemy(): Enemy | null {
    const player = this.entityManager.getPlayer();
    if (!player) return null;
    return this.entityManager.getNearestEnemy(player.x, player.y);
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
      this.renderWeaponsAroundPlayer(player);
    }

    // Render boss health bar
    this.renderBossHealthBar();

    // Render enemy count (dev mode only, when enabled)
    if (this.showEnemyCount) {
      HUD.renderEnemyCount(this.ctx, this.entityManager.getActiveEnemyCount(), this.canvas.height);
    }
  }

  private renderWeaponsAroundPlayer(player: Player): void {
    for (let i = 0; i < this.weapons.length; i++) {
      const weapon = this.weapons[i]!;
      const pos = player.getWeaponPosition(i, player.currentTarget);

      // Use WeaponRenderer
      WeaponRenderer.drawWeaponIcon(
        this.ctx,
        {
          type: weapon.type,
          level: weapon.level,
          color: weapon.config.color,
        },
        pos.x,
        pos.y,
        pos.angle,
      );
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
    return {
      weapons: this.weapons.map((w) => this.createShopWeapon(w)),
      maxWeapons: player.maxWeapons,
      items: player.items,
      maxHp: player.maxHp,
      hp: player.hp,
      addWeapon: (type: string) => { this.addWeapon(type as WeaponType); },
      addItem: (itemKey: string) => { player.addItem(itemKey); },
      heal: (amount: number) => { player.heal(amount); },
      // Stats for shop item effects
      armor: player.armor,
      damageMultiplier: player.damageMultiplier,
      critChance: player.critChance,
      dodge: player.dodge,
      regen: player.regen,
      lifesteal: player.lifesteal,
      speed: player.speed,
      thorns: player.thorns,
      attackRange: player.attackRange,
      explosionRadius: player.explosionRadius,
    };
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

  // ============ Game Over ============

  private gameOver(): void {
    this.state = 'gameover';
    this.audio.gameOver();

    const finalWave = document.getElementById('final-wave');
    const finalXp = document.getElementById('final-xp');
    if (finalWave) finalWave.textContent = String(this.waveManager.waveNumber);
    if (finalXp) finalXp.textContent = String(this.xp);
    document.getElementById('game-over')?.classList.remove('hidden');

    // Load saved player name
    const savedName = localStorage.getItem('circle_survivor_player_name') ?? '';
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    if (playerNameInput) playerNameInput.value = savedName;

    // Show leaderboard
    void this.showLeaderboard('local');
  }
}
