/**
 * Main Game Controller
 * Uses new TypeScript architecture with EntityManager and Systems.
 * Preserves all game mechanics, values and visual appearance from original.
 */

import { Player, InputState } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
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
import { CharacterType, WeaponType, ProjectileType, EnemyType, PickupType, VisualEffect } from '@/types/enums';
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
}

// ============ Game Class ============

export class Game {
  // Canvas
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // Game state
  state: GameState = 'start';
  lastTime: number = 0;
  selectedCharacter: CharacterType | null = null;

  // Entity Manager
  entityManager: EntityManager;

  // Weapon instances (runtime state)
  weapons: WeaponInstance[] = [];

  // Systems
  collisionSystem: CollisionSystem;
  waveManager: WaveManager;
  shop: Shop;
  audio: AudioSystem;
  leaderboard: Leaderboard;
  leaderboardUI: LeaderboardUI;
  inputHandler: InputHandler;

  // Effects
  effects: EffectsState;

  // Resources
  gold: number = 0;
  xp: number = 0;

  // Input
  keys: KeyState = {};

  // Regeneration tracking
  private lastRegenTime: number = 0;

  constructor() {
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
      onPause: () => this.pauseGame(),
      onResume: () => this.resumeGame(),
      onSelectCharacter: (type: string) => this.selectCharacter(type as CharacterType),
      onRestart: () => this.showCharacterSelect(),
      onStartWave: () => this.startNextWave(),
      onQuitToMenu: () => this.quitToMenu(),
      onToggleSound: () => this.toggleSound(),
      onSubmitScore: () => this.submitScore(),
      onSwitchLeaderboardTab: (tab: string) => this.switchLeaderboardTab(tab),
      onOpenMenuLeaderboard: () => this.openMenuLeaderboard(),
      onCloseMenuLeaderboard: () => this.closeMenuLeaderboard(),
      onSwitchMenuLeaderboardTab: (tab: string) => this.switchMenuLeaderboardTab(tab),
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
      playPurchaseSound: () => this.audio.purchase(),
      playErrorSound: () => this.audio.error(),
      showNotification: (message: string) => this.showNotification(message),
      updateHUD: () => this.updateHUD(),
    });

    // Bind to window for global access
    (window as unknown as { game: Game }).game = this;

    this.setupEventBusListeners();
  }

  // ============ Setup ============

  setupEventBusListeners(): void {
    EventBus.on('enemyDeath', ({ enemy }) => {
      this.handleEnemyDeath(enemy as Enemy);
    });
  }

  showNotification(message: string): void {
    console.log('Notification:', message);
    // TODO: Implement visual notification
  }

  // ============ Leaderboard Methods ============

  async openMenuLeaderboard(): Promise<void> {
    await this.leaderboardUI.openMenuLeaderboard();
  }

  closeMenuLeaderboard(): void {
    this.leaderboardUI.closeMenuLeaderboard();
  }

  async showMenuLeaderboard(tab: string = 'local'): Promise<void> {
    await this.leaderboardUI.showMenuLeaderboard(tab);
  }

  switchMenuLeaderboardTab(tab: string): void {
    this.leaderboardUI.switchMenuLeaderboardTab(tab);
  }

  async submitScore(): Promise<void> {
    await this.leaderboardUI.submitScore(this.waveManager.waveNumber, this.xp, this.selectedCharacter);
  }

  async showLeaderboard(tab: string = 'local', highlightName: string | null = null): Promise<void> {
    await this.leaderboardUI.showLeaderboard(tab, highlightName);
  }

  switchLeaderboardTab(tab: string): void {
    this.leaderboardUI.switchLeaderboardTab(tab);
  }

  // ============ Character Selection ============

  selectCharacter(characterType: CharacterType): void {
    this.selectedCharacter = characterType;

    // Mark selected card
    document.querySelectorAll('.character-card').forEach((card) => {
      card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-character="${characterType}"]`);
    if (selectedCard) selectedCard.classList.add('selected');

    // Start game after short delay
    setTimeout(() => this.startGame(), 300);
  }

  showCharacterSelect(): void {
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

  toggleSound(): void {
    this.audio.toggle();
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.textContent = this.audio.isEnabled() ? '🔊 Dźwięk: WŁ' : '🔇 Dźwięk: WYŁ';
    }
  }

  // ============ Pause Menu ============

  pauseGame(): void {
    this.state = 'paused';
    document.getElementById('pause-menu')?.classList.remove('hidden');
  }

  resumeGame(): void {
    this.state = 'playing';
    document.getElementById('pause-menu')?.classList.add('hidden');
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  quitToMenu(): void {
    this.state = 'start';
    document.getElementById('pause-menu')?.classList.add('hidden');
    this.showCharacterSelect();
  }

  // ============ Game Start ============

  startGame(): void {
    if (!this.selectedCharacter) {
      this.selectedCharacter = CharacterType.NORMIK;
    }

    // Initialize audio
    this.audio.init();

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
    this.addWeapon(charConfig.startingWeapon as WeaponType);

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
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  startNextWave(): void {
    this.shop.hideShop();
    this.state = 'playing';

    const player = this.entityManager.getPlayer();
    if (player) {
      player.hp = player.maxHp;
    }

    // Clear entities except player
    this.entityManager.clearExceptPlayer();

    this.waveManager.startWave();
    this.audio.waveStart();
  }

  // ============ Weapon Management ============

  addWeapon(type: WeaponType): void {
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
      multishot: config.bulletCount ?? 1,
      name: config.name,
    });
  }

  // ============ Game Loop ============

  gameLoop(timestamp: number): void {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.state === 'playing') {
      this.update(deltaTime, timestamp);
    }

    this.render();

    if (this.state !== 'gameover' && this.state !== 'paused') {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  // ============ Update ============

  update(deltaTime: number, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

    const deltaSeconds = deltaTime / 1000;

    // Get input state
    const input: InputState = {
      up: this.keys['w'] || this.keys['ArrowUp'] || false,
      down: this.keys['s'] || this.keys['ArrowDown'] || false,
      left: this.keys['a'] || this.keys['ArrowLeft'] || false,
      right: this.keys['d'] || this.keys['ArrowRight'] || false,
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

      // Remove expired
      if (!projectile.isActive) {
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
              this.handleExplosion(projectile.x, projectile.y, expRadius, projectile.damage * player.damageMultiplier);
              projectile.destroy();
              break;
            }

            const finalDamage = projectile.damage * player.damageMultiplier;
            const isDead = enemy.takeDamage(finalDamage, projectile.x, projectile.y, player.knockback * projectile.knockbackMultiplier);

            // Chain effect
            if (projectile.canChain() && projectile.chain) {
              this.handleChainEffect(enemy.x, enemy.y, finalDamage * 0.5, projectile.chain.chainCount);
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
        const nearbyEnemies = this.entityManager.getEnemiesInRadius(deployable.x, deployable.y, deployable.triggerRadius);
        if (nearbyEnemies.length > 0) {
          const explosionData = deployable.trigger();
          if (explosionData) {
            this.handleExplosion(deployable.x, deployable.y, explosionData.explosionRadius, explosionData.explosionDamage);
          }
        }
      }
    }

    // Update pickups
    const pickups = this.entityManager.getActivePickups();
    for (const pickup of pickups) {
      pickup.update(deltaSeconds);

      if (!pickup.isActive) continue;

      // Check collection
      const distToPlayer = distance(pickup, player);
      if (distToPlayer < player.pickupRange) {
        // Move towards player (magnet effect)
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          pickup.x += (dx / dist) * 5;
          pickup.y += (dy / dist) * 5;
        }
      }

      if (circleCollision(pickup, player)) {
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

  fireWeapons(currentTime: number, player: Player): void {
    for (let i = 0; i < this.weapons.length; i++) {
      const weapon = this.weapons[i]!;
      const config = weapon.config;

      // Calculate fire rate with level and player multiplier
      const levelMultiplier = 1 + (weapon.level - 1) * 0.1;
      const fireRate = config.fireRate / levelMultiplier / player.attackSpeedMultiplier;

      if (currentTime - weapon.lastFireTime < fireRate) continue;

      // Find target for this weapon
      const weaponPos = player.getWeaponPosition(i, player.currentTarget);
      const maxRange = config.range * player.attackRange;
      const target = this.entityManager.getNearestEnemy(weaponPos.x, weaponPos.y, maxRange);

      if (!target) continue;

      weapon.lastFireTime = currentTime;

      // Calculate damage with level
      const baseDamage = config.damage * (1 + (weapon.level - 1) * 0.15);

      // Calculate projectile count
      const projectileCount = (config.bulletCount ?? 1) + weapon.multishot + player.projectileCount;

      // Fire based on weapon type
      this.fireWeaponProjectiles(weapon, weaponPos, target, baseDamage, projectileCount, player);
    }
  }

  fireWeaponProjectiles(
    weapon: WeaponInstance,
    pos: { x: number; y: number; angle: number },
    target: Enemy | null,
    damage: number,
    projectileCount: number,
    player: Player
  ): void {
    const config = weapon.config;
    const targetAngle = target ? Math.atan2(target.y - pos.y, target.x - pos.x) : pos.angle;

    // Critical hit check
    const isCrit = Math.random() < player.critChance;
    const finalDamage = isCrit ? damage * player.critDamage : damage;

    for (let i = 0; i < projectileCount; i++) {
      // Spread angle for multiple projectiles
      let angle = targetAngle;
      if (projectileCount > 1) {
        const spreadAngle = config.spread ?? 0.2;
        const offset = (i - (projectileCount - 1) / 2) * spreadAngle;
        angle += offset;
      }

      const speed = config.bulletSpeed ?? 10;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const projectile = new Projectile({
        x: pos.x,
        y: pos.y,
        radius: config.bulletRadius ?? 5,
        type: this.getProjectileType(weapon.type),
        damage: finalDamage,
        ownerId: player.id,
        color: config.color ?? '#ffff00',
        maxDistance: config.range ?? 500,
        pierce: config.pierce ? { pierceCount: (config.pierceCount ?? 1) + player.pierce, hitEnemies: new Set() } : undefined,
        chain: config.chain ? { chainCount: config.chainCount ?? 3, chainRange: 150, chainedEnemies: new Set() } : undefined,
        explosive: config.explosive
          ? {
              explosionRadius: config.explosionRadius ?? 50,
              explosionDamage: finalDamage,
              visualEffect: this.getExplosionEffect(weapon.type),
            }
          : undefined,
      });

      projectile.setVelocity(vx, vy);
      projectile.isCrit = isCrit;
      projectile.knockbackMultiplier = config.knockbackMultiplier ?? 1;

      this.entityManager.addProjectile(projectile);
    }

    // Play weapon sound
    this.playWeaponSound(weapon.type);
  }

  getProjectileType(weaponType: WeaponType): ProjectileType {
    const mapping: Partial<Record<WeaponType, ProjectileType>> = {
      [WeaponType.SCYTHE]: ProjectileType.SCYTHE,
      [WeaponType.SWORD]: ProjectileType.SWORD,
      [WeaponType.BAZOOKA]: ProjectileType.ROCKET,
      [WeaponType.NUKE]: ProjectileType.NUKE,
      [WeaponType.FLAMETHROWER]: ProjectileType.FLAMETHROWER,
      [WeaponType.LASER]: ProjectileType.STANDARD, // Laser uses standard projectile type
    };
    return mapping[weaponType] ?? ProjectileType.STANDARD;
  }

  getExplosionEffect(weaponType: WeaponType): VisualEffect {
    if (weaponType === WeaponType.NUKE) return VisualEffect.NUKE;
    if (weaponType === WeaponType.HOLY_GRENADE) return VisualEffect.HOLY;
    if (weaponType === WeaponType.BANANA) return VisualEffect.BANANA;
    return VisualEffect.STANDARD;
  }

  playWeaponSound(type: WeaponType): void {
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
        this.audio.explosion();
        break;
      default:
        this.audio.shoot();
    }
  }

  // ============ Combat Effects ============

  updateShockwaves(currentTime: number): void {
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
      () => this.audio.dodge()
    );

    if (playerDied) this.gameOver();
  }

  handleEnemyDeath(enemy: Enemy): void {
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

    // Drop gold
    const goldPickup = createGoldPickup(enemy.x, enemy.y, enemy.goldValue);
    this.entityManager.addPickup(goldPickup);

    // Chance for health drop
    if (Math.random() < 0.05) {
      const healthPickup = createHealthPickup(enemy.x + 20, enemy.y, 10);
      this.entityManager.addPickup(healthPickup);
    }

    // Play sound
    this.audio.enemyDeath();

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

  spawnSplitEnemies(enemy: Enemy): void {
    const splitType = enemy.type === 'splitter' ? 'swarm' : 'basic';
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

  handleExplosion(x: number, y: number, radius: number, damage: number): void {
    const player = this.entityManager.getPlayer();
    const damageMultiplier = player?.damageMultiplier ?? 1;

    // Create visual
    EffectsSystem.createExplosion(this.effects, x, y, radius);

    // Damage enemies in radius
    const enemies = this.entityManager.getEnemiesInRadius(x, y, radius);
    for (const enemy of enemies) {
      const isDead = enemy.takeDamage(damage * damageMultiplier, x, y);
      if (isDead) {
        this.handleEnemyDeath(enemy);
      }
    }

    this.audio.explosion();
  }

  handleChainEffect(startX: number, startY: number, damage: number, chainCount: number): void {
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

  findNearestEnemy(): Enemy | null {
    const player = this.entityManager.getPlayer();
    if (!player) return null;
    return this.entityManager.getNearestEnemy(player.x, player.y);
  }

  // ============ Render ============

  render(): void {
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

    // Render enemy count
    HUD.renderEnemyCount(this.ctx, this.entityManager.getActiveEnemyCount(), this.canvas.height);
  }

  renderWeaponsAroundPlayer(player: Player): void {
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
        pos.angle
      );
    }
  }

  renderBossHealthBar(): void {
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

  updateHUD(): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;
    HUD.update(player, this.waveManager, this.gold, this.xp);
  }

  // ============ Shop ============

  openShop(): void {
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

  createShopPlayer(player: Player): ShopPlayer {
    return {
      weapons: this.weapons.map((w) => this.createShopWeapon(w)),
      maxWeapons: player.maxWeapons,
      items: player.items,
      maxHp: player.maxHp,
      hp: player.hp,
      addWeapon: (type: string) => this.addWeapon(type as WeaponType),
      addItem: (itemKey: string) => player.addItem(itemKey),
      heal: (amount: number) => player.heal(amount),
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

  createShopWeapon(weapon: WeaponInstance): ShopWeapon {
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

  gameOver(): void {
    this.state = 'gameover';
    this.audio.gameOver();

    const finalWave = document.getElementById('final-wave');
    const finalXp = document.getElementById('final-xp');
    if (finalWave) finalWave.textContent = String(this.waveManager.waveNumber);
    if (finalXp) finalXp.textContent = String(this.xp);
    document.getElementById('game-over')?.classList.remove('hidden');

    // Load saved player name
    const savedName = localStorage.getItem('circle_survivor_player_name') || '';
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    if (playerNameInput) playerNameInput.value = savedName;

    // Show leaderboard
    this.showLeaderboard('local');
  }
}
