/**
 * CombatSystem - Handles damage, explosions, and combat effects.
 * Processes collision results and applies damage, knockback, etc.
 */
import { GAME_BALANCE } from '@/config/balance.config';
import { WEAPON_TYPES } from '@/config/weapons.config';
import { EventBus } from '@/core/EventBus';
import { Enemy } from '@/entities/Enemy';
import { Pickup } from '@/entities/Pickup';
import { Projectile } from '@/entities/Projectile';
import { EntityManager } from '@/managers/EntityManager';
import { EnemyType, PickupType, ProjectileType, VisualEffect } from '@/types/enums';
import { distance, TWO_PI, Vector2 } from '@/utils/math';
import { randomChance, randomInt, randomRange } from '@/utils/random';
import { CollisionResult } from './CollisionSystem';
import { EffectsState, EffectsSystem } from './EffectsSystem';

/**
 * Explosion event data
 */
export interface ExplosionEvent {
  position: Vector2;
  radius: number;
  damage: number;
  visualEffect: VisualEffect;
  sourceId: number;
  // TODO - some enum / type instead of booleans
  isBanana?: boolean;
  isMini?: boolean;
  /** If true, explosion damages player (enemy explosions only) */
  isEnemyExplosion?: boolean;
}

/**
 * Runtime config passed to processCollisions
 * Contains player-dependent values that can change
 */
// TODO all these are stored in Player, remove
export interface CombatRuntimeConfig {
  /** Player gold multiplier */
  goldMultiplier: number;
  /** Player damage multiplier */
  damageMultiplier: number;
  /** Player explosion radius multiplier */
  explosionRadius: number;
  /** Player knockback value */
  knockback: number;
}

/**
 * Handles all combat-related logic.
 * Processes damage, and handles explosions.
 *
 * @example
 * ```typescript
 * const combatSystem = new CombatSystem(entityManager, collisionSystem);
 *
 * // In game loop
 * const collisions = collisionSystem.checkAll();
 * combatSystem.processCollisions(collisions, currentTime);
 * ```
 */
export class CombatSystem {
  private entityManager: EntityManager;
  private effects: EffectsState;

  /** Pending explosions to process */
  private pendingExplosions: ExplosionEvent[] = [];

  /** Runtime config - updated each frame from player stats */
  private runtimeConfig: CombatRuntimeConfig = {
    goldMultiplier: 1,
    damageMultiplier: 1,
    explosionRadius: 1,
    knockback: 0,
  };

  public constructor(entityManager: EntityManager, effects: EffectsState) {
    this.entityManager = entityManager;
    this.effects = effects;
  }

  /**
   * Update runtime config from player stats
   * Call this before processCollisions each frame
   */
  public updateRuntimeConfig(config: Partial<CombatRuntimeConfig>): void {
    if (config.goldMultiplier !== undefined)
      this.runtimeConfig.goldMultiplier = config.goldMultiplier;
    if (config.damageMultiplier !== undefined)
      this.runtimeConfig.damageMultiplier = config.damageMultiplier;
    if (config.explosionRadius !== undefined)
      this.runtimeConfig.explosionRadius = config.explosionRadius;
    if (config.knockback !== undefined) this.runtimeConfig.knockback = config.knockback;
  }

  /**
   * Process all collisions from CollisionSystem
   */
  public processCollisions(collisions: CollisionResult, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

    // Process player-enemy collisions
    for (const enemy of collisions.playerEnemyCollisions) {
      // Dodge chance
      if (randomChance(player.dodge)) {
        EventBus.emit('playerDodged', undefined);
        continue;
      }

      // Boss damage multiplier
      let damage = enemy.damage;
      if (enemy.isBoss) {
        damage *= GAME_BALANCE.boss.contactDamageMultiplier;
      }

      const isDead = player.takeDamage(damage, currentTime);

      EventBus.emit('playerHit', {
        player,
        damage,
        source: enemy,
      });

      // Thorns damage - applied after player takes damage
      if (player.thorns > 0) {
        EventBus.emit('thornsTriggered', undefined);
        const thornsKilled = enemy.takeDamage(player.thorns, enemy.position, player.knockback);
        if (thornsKilled) {
          this.handleEnemyDeath(enemy, 'player', currentTime);
        }
      }

      if (isDead) {
        EventBus.emit('playerDeath', { player, killedBy: enemy });
      }
    }

    // Process player-projectile collisions (enemy bullets)
    for (const projectile of collisions.playerProjectileCollisions) {
      // Dodge chance for projectiles too
      if (randomChance(player.dodge)) {
        EventBus.emit('playerDodged', undefined);
        projectile.destroy();
        continue;
      }

      const isDead = player.takeDamage(projectile.damage, currentTime);
      projectile.destroy();

      EventBus.emit('playerHit', {
        player,
        damage: projectile.damage,
        source: projectile,
      });

      if (isDead) {
        EventBus.emit('playerDeath', { player, killedBy: null });
      }
    }

    // Process projectile-enemy collisions
    for (const { projectile, enemy } of collisions.projectileEnemyCollisions) {
      this.processProjectileHit(projectile, enemy, currentTime);
    }

    // Process pickup collisions
    for (const pickup of collisions.pickupCollisions) {
      this.processPickupCollection(pickup);
    }

    // Process deployable triggers
    for (const { deployable } of collisions.deployableCollisions) {
      const explosionData = deployable.trigger();
      if (explosionData) {
        this.queueExplosion({
          position: deployable.position,
          radius: explosionData.explosionRadius,
          damage: explosionData.explosionDamage,
          visualEffect: explosionData.visualEffect ?? VisualEffect.STANDARD,
          sourceId: deployable.id,
        });
      }
    }

    // Process any pending explosions
    this.processExplosions(currentTime);
  }

  /**
   * Process a projectile hitting an enemy
   * Uses runtimeConfig for damageMultiplier, explosionRadius, and knockback
   */
  private processProjectileHit(projectile: Projectile, enemy: Enemy, currentTime: number): void {
    // Skip if enemy already dead (prevents multiple death events from shotgun pellets in same frame)
    if (enemy.isDead()) {
      return;
    }

    const { damageMultiplier, explosionRadius, knockback } = this.runtimeConfig;
    const player = this.entityManager.getPlayer();
    const finalDamage = projectile.damage * damageMultiplier;

    // Apply damage with knockback (using player knockback * projectile knockback multiplier)
    const totalKnockback = knockback * projectile.knockbackMultiplier;
    const isDead = enemy.takeDamage(finalDamage, projectile.position, totalKnockback);

    EventBus.emit('enemyDamaged', {
      enemy,
      damage: finalDamage,
      source: projectile.position,
    });

    // Lifesteal
    if (player && player.lifesteal > 0) {
      // TODO nerf it, make it a chance instead of flat %
      const healAmount = finalDamage * player.lifesteal;
      player.heal(healAmount);
    }

    // Handle enemy death
    if (isDead) {
      this.handleEnemyDeath(enemy, 'player', currentTime);
    }

    // Handle explosive projectiles
    if (projectile.isExplosive() && projectile.explosive) {
      const isBanana =
        projectile.type === ProjectileType.BANANA || projectile.type === ProjectileType.MINI_BANANA;
      const isMini = projectile.type === ProjectileType.MINI_BANANA;
      // Apply player's explosionRadius multiplier
      const expRadius = projectile.explosive.explosionRadius * explosionRadius;
      this.queueExplosion({
        position: projectile.position,
        radius: expRadius,
        damage: projectile.explosive.explosionDamage * damageMultiplier,
        visualEffect: projectile.explosive.visualEffect,
        sourceId: projectile.id,
        isBanana,
        isMini,
      });
    }

    // Destroy non-piercing projectiles
    if (!projectile.canPierce()) {
      projectile.destroy();
    } else if (projectile.pierce && projectile.pierce.pierceCount <= 0) {
      projectile.destroy();
    }

    EventBus.emit('projectileHit', { projectile, target: enemy });
  }

  /**
   * Queue an explosion for processing
   */
  public queueExplosion(explosion: ExplosionEvent): void {
    this.pendingExplosions.push(explosion);
  }

  /**
   * Process all pending explosions
   */
  private processExplosions(currentTime: number): void {
    const player = this.entityManager.getPlayer();
    const damageMultiplier = player?.damageMultiplier ?? 1;

    while (this.pendingExplosions.length > 0) {
      const explosion = this.pendingExplosions.shift();
      if (explosion) {
        this.processExplosion(explosion, damageMultiplier, currentTime);
      }
    }
  }

  /**
   * Process a single explosion
   */
  private processExplosion(
    explosion: ExplosionEvent,
    damageMultiplier: number,
    currentTime: number,
  ): void {
    const { position, radius, damage, visualEffect, isBanana, isMini, isEnemyExplosion } =
      explosion;

    // Determine explosion type flags
    const isNuke = visualEffect === VisualEffect.NUKE;
    const isHolyGrenade = visualEffect === VisualEffect.HOLY;
    const isBananaEffect = visualEffect === VisualEffect.BANANA;

    // Create visual effect
    EffectsSystem.createExplosion(
      this.effects,
      position,
      radius,
      isNuke,
      isHolyGrenade,
      isBananaEffect,
    );

    // Damage player if this is an enemy explosion
    if (isEnemyExplosion) {
      const player = this.entityManager.getPlayer();
      if (player?.isActive) {
        const distToPlayer = distance(player.position, position);

        if (distToPlayer <= radius) {
          // Player in explosion radius - deal damage
          player.takeDamage(damage, currentTime);

          EventBus.emit('playerHit', {
            player,
            damage,
            // TODO add explosion source type handling
            source: 'explosion',
          });
        }
      }
    }

    // Find enemies in explosion radius
    const enemies = this.entityManager.getEnemiesInRadius(position, radius);

    for (const enemy of enemies) {
      const isDead = enemy.takeDamage(damage * damageMultiplier, position);

      EventBus.emit('enemyDamaged', {
        enemy,
        damage: damage * damageMultiplier,
        source: position,
      });

      if (isDead) {
        this.handleEnemyDeath(enemy, 'explosion', currentTime);
      }
    }

    // Banana (not mini) - spawn mini bananas
    if (isBanana && !isMini) {
      this.spawnMiniBananas(position.x, position.y, randomInt(4, 6), damageMultiplier);
    }

    // Emit explosion event for audio and other listeners
    EventBus.emit('explosionTriggered', {
      position,
      radius,
      damage,
      visualEffect: isNuke ? 'nuke' : isHolyGrenade ? 'holy' : 'standard',
      isBanana,
    });
  }

  /**
   * Process enemy death from external source (e.g. collision in Game.ts)
   * Use this when enemy dies outside of CombatSystem collision processing
   */
  public processEnemyDeath(
    enemy: Enemy,
    killer: 'player' | 'explosion' = 'player',
    currentTime: number = performance.now(),
  ): void {
    this.handleEnemyDeath(enemy, killer, currentTime);
  }

  /**
   * Handle enemy death - spawn pickups, emit events
   */
  private handleEnemyDeath(
    enemy: Enemy,
    killer: 'player' | 'explosion',
    currentTime: number,
  ): void {
    // Create death effect
    EffectsSystem.createDeathEffect(this.effects, {
      position: enemy.position,
      color: enemy.color,
      isBoss: enemy.isBoss,
      type: enemy.type,
    });

    // Boss death - special explosion sound via event
    if (enemy.isBoss) {
      EventBus.emit('explosionTriggered', {
        position: enemy.position,
        radius: 0,
        damage: 0,
        visualEffect: 'nuke',
      });
    }

    // Handle explodeOnDeath - process immediately, not queued
    if (enemy.explodeOnDeath && enemy.explosionRadius > 0) {
      const player = this.entityManager.getPlayer();
      const damageMultiplier = player?.damageMultiplier ?? 1;
      this.processExplosion(
        {
          position: enemy.position,
          radius: enemy.explosionRadius,
          damage: enemy.explosionDamage,
          visualEffect: VisualEffect.FIRE,
          sourceId: enemy.id,
          isEnemyExplosion: true,
        },
        damageMultiplier,
        currentTime,
      );
    }

    // TODO move to SpawnSystem
    // Handle splitOnDeath
    if (enemy.splitOnDeath) {
      this.spawnSplitEnemies(enemy);
    }

    // Emit death event (audio plays via EventBus listener)
    EventBus.emit('enemyDeath', {
      enemy,
      killer,
    });

    // Remove from manager
    enemy.destroy();
  }

  /**
   * Spawn split enemies when enemy with splitOnDeath dies
   */
  private spawnSplitEnemies(enemy: Enemy): void {
    const splitType = enemy.type === EnemyType.SPLITTER ? EnemyType.SWARM : EnemyType.BASIC;

    for (let i = 0; i < enemy.splitCount; i++) {
      const angle = (TWO_PI * i) / enemy.splitCount;
      const offsetX = Math.cos(angle) * 30;
      const offsetY = Math.sin(angle) * 30;

      const splitEnemy = new Enemy({
        position: {
          x: enemy.position.x + offsetX,
          y: enemy.position.y + offsetY,
        },
        type: splitType,
        scale: 0.6,
      });

      this.entityManager.addEnemy(splitEnemy);
    }
  }

  /**
   * Process pickup collection
   * Applies goldMultiplier for gold pickups and heals player for health pickups
   */
  private processPickupCollection(pickup: Pickup): void {
    const value = pickup.collect();
    if (pickup.type === PickupType.GOLD) {
      // TODO should only pickup, multiply gold in reward system
      // Apply goldMultiplier from runtimeConfig
      const goldAmount = Math.floor(value * this.runtimeConfig.goldMultiplier);
      EventBus.emit('goldCollected', {
        amount: goldAmount,
        position: pickup.position,
      });
    } else if (pickup.type === PickupType.HEALTH) {
      EventBus.emit('healthCollected', {
        amount: value,
        position: pickup.position,
      });
    }
  }

  /**
   * Apply damage to all enemies in area
   */
  public applyAreaDamage(
    position: Vector2,
    radius: number,
    damage: number,
    visualEffect: VisualEffect = VisualEffect.STANDARD,
  ): void {
    this.queueExplosion({
      position,
      radius,
      damage,
      visualEffect,
      sourceId: -1,
    });
    this.processExplosions(performance.now());
  }

  /**
   * Trigger an explosion at position (used for grenades, mines, etc.)
   * Handles visual effects, damage, and banana splitting
   */
  public triggerExplosion(
    position: Vector2,
    radius: number,
    damage: number,
    visualEffect: VisualEffect = VisualEffect.STANDARD,
    isMini: boolean = false,
  ): void {
    const isBanana = visualEffect === VisualEffect.BANANA;
    this.queueExplosion({
      position,
      radius,
      damage,
      visualEffect,
      sourceId: -1,
      isBanana,
      isMini,
    });
    this.processExplosions(performance.now());
  }

  /**
   * Spawn mini bananas after main banana explosion
   */
  private spawnMiniBananas(x: number, y: number, count: number, damageMultiplier: number): void {
    const config = WEAPON_TYPES.minibanana;
    const player = this.entityManager.getPlayer();
    const explosionRadiusMultiplier = player?.explosionRadius ?? 1;
    const playerId = player?.id ?? -1;

    for (let i = 0; i < count; i++) {
      const angle = (TWO_PI / count) * i + randomRange(-0.25, 0.25);

      // Random speed (6-10) and distance (60-100px) for each mini banana
      const speed = randomInt(6, 10);
      const range = randomInt(60, 100);

      const projectile = new Projectile({
        position: {
          x,
          y,
        },
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: config.damage * damageMultiplier,
        radius: config.bulletRadius ?? 6,
        color: config.color,
        type: ProjectileType.MINI_BANANA,
        ownerId: playerId,
        // Use explosiveRange for grenade-like behavior (explodes at distance)
        explosiveRange: range,
        bulletSpeed: speed,
        weaponCategory: 'grenade',
        explosive: {
          explosionRadius: (config.explosionRadius ?? 45) * explosionRadiusMultiplier,
          explosionDamage: config.damage * damageMultiplier,
          visualEffect: VisualEffect.BANANA,
        },
      });

      this.entityManager.addProjectile(projectile);
    }
  }
}
