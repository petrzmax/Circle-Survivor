/**
 * CombatSystem - Handles damage, explosions, and combat effects.
 * Processes collision results and applies damage, knockback, etc.
 */
import { singleton } from 'tsyringe';
import { GAME_BALANCE } from '@/config/balance.config';
import { EventBus } from '@/events/EventBus';
import { Enemy } from '@/domain/enemies';
import { WEAPON_TYPES } from '@/domain/weapons/config';
import { Pickup } from '@/entities/Pickup';
import { Projectile } from '@/entities/Projectile';
import { EntityManager } from '@/managers/EntityManager';
import { PickupType, ProjectileType, VisualEffect } from '@/types/enums';
import { distance, TWO_PI, Vector2 } from '@/utils/math';
import { randomChance, randomInt, randomRange } from '@/utils/random';
import { CollisionResult } from './CollisionSystem';

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
@singleton()
export class CombatSystem {
  private entityManager: EntityManager;

  /** Pending explosions to process */
  private pendingExplosions: ExplosionEvent[] = [];

  /** Runtime config - updated each frame from player stats */
  private runtimeConfig: CombatRuntimeConfig = {
    damageMultiplier: 1,
    explosionRadius: 1,
    knockback: 0,
  };

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Update runtime config from player stats
   * Call this before processCollisions each frame
   */
  public updateRuntimeConfig(config: Partial<CombatRuntimeConfig>): void {
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

      const actualDamage = player.takeDamage(damage, currentTime);

      EventBus.emit('playerHit', {
        player,
        damage,
        source: enemy,
      });

      // Thorns damage - reflect percentage of actual damage taken
      if (player.thorns > 0 && actualDamage > 0) {
        EventBus.emit('thornsTriggered', undefined);
        const thornsDamage = actualDamage * player.thorns;
        const thornsKilled = enemy.takeDamage(thornsDamage, enemy.position, player.knockback);
        if (thornsKilled) {
          this.handleEnemyDeath(enemy, 'player');
        }
      }

      if (player.isDead()) {
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

      player.takeDamage(projectile.damage, currentTime);
      projectile.destroy();

      EventBus.emit('playerHit', {
        player,
        damage: projectile.damage,
        source: projectile,
      });

      if (player.isDead()) {
        EventBus.emit('playerDeath', { player, killedBy: null });
      }
    }

    // Process projectile-enemy collisions
    for (const { projectile, enemy } of collisions.projectileEnemyCollisions) {
      this.processProjectileHit(projectile, enemy);
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

    // Process shockwave-player collisions
    for (const shockwave of collisions.shockwavePlayerCollisions) {
      if (randomChance(player.dodge)) {
        EventBus.emit('playerDodged', undefined);
      } else {
        player.takeDamage(shockwave.damage, currentTime);

        if (player.isDead()) {
          EventBus.emit('playerDeath', { player, killedBy: null });
        }
      }
      shockwave.damageDealt = true;
    }

    // Process any pending explosions
    this.processExplosions(currentTime);
  }

  /**
   * Process a projectile hitting an enemy
   * Uses runtimeConfig for damageMultiplier, explosionRadius, and knockback
   */
  private processProjectileHit(projectile: Projectile, enemy: Enemy): void {
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

    // Lifesteal - chance to heal 1 HP on hit
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (player && player.lifesteal > 0) {
      if (randomChance(player.lifesteal)) {
        player.heal(1);
      }
    }

    // Handle enemy death
    if (isDead) {
      this.handleEnemyDeath(enemy, 'player');
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
        damage: projectile.explosive.explosionDamage,
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
    const damageMultiplier = player.damageMultiplier;

    // Track enemies already killed this batch to avoid redundant damage on overlapping explosions
    const killedThisBatch = new Set<number>();

    while (this.pendingExplosions.length > 0) {
      const explosion = this.pendingExplosions.shift();
      if (explosion) {
        this.processExplosion(explosion, damageMultiplier, currentTime, killedThisBatch);
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
    killedThisBatch?: Set<number>,
  ): void {
    const { position, radius, damage, visualEffect, isBanana, isMini, isEnemyExplosion } =
      explosion;

    // Damage player if this is an enemy explosion
    if (isEnemyExplosion) {
      const player = this.entityManager.getPlayer();
      if (player.isActive) {
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
      // Skip enemies already killed in this explosion batch
      if (killedThisBatch?.has(enemy.id) || enemy.isDead()) {
        continue;
      }

      const isDead = enemy.takeDamage(damage * damageMultiplier, position);

      EventBus.emit('enemyDamaged', {
        enemy,
        damage: damage * damageMultiplier,
        source: position,
      });

      if (isDead) {
        killedThisBatch?.add(enemy.id);
        this.handleEnemyDeath(enemy, 'explosion');
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
      visualEffect,
    });
  }

  /**
   * Process enemy death from external source (e.g. collision in Game.ts)
   * Use this when enemy dies outside of CombatSystem collision processing
   */
  public processEnemyDeath(
    enemy: Enemy,
    killer: 'player' | 'explosion' = 'player',
    _currentTime: number = performance.now(),
  ): void {
    this.handleEnemyDeath(enemy, killer);
  }

  /**
   * Handle enemy death - spawn pickups, emit events
   */
  private handleEnemyDeath(enemy: Enemy, killer: 'player' | 'explosion'): void {
    // Handle explodeOnDeath - queued to avoid deep recursive call stacks
    if (enemy.explodeOnDeath && enemy.explosionRadius > 0) {
      this.queueExplosion({
        position: { x: enemy.position.x, y: enemy.position.y },
        radius: enemy.explosionRadius,
        damage: enemy.explosionDamage,
        visualEffect: VisualEffect.FIRE,
        sourceId: enemy.id,
        isEnemyExplosion: true,
      });
    }

    EventBus.emit('enemyDeath', {
      enemy,
      killer,
    });

    enemy.destroy();
  }

  private processPickupCollection(pickup: Pickup): void {
    const amount = pickup.collect();

    switch (pickup.type) {
      case PickupType.GOLD:
        EventBus.emit('goldCollected', {
          amount,
          position: pickup.position,
        });
        break;
      case PickupType.HEALTH:
        EventBus.emit('healthCollected', {
          amount,
          position: pickup.position,
        });
        break;
      default:
        throw new Error('Not supported pickup type');
    }
  }

  /**
   * Spawn mini bananas after main banana explosion
   */
  private spawnMiniBananas(x: number, y: number, count: number, damageMultiplier: number): void {
    const config = WEAPON_TYPES.minibanana;
    const player = this.entityManager.getPlayer();
    const explosionRadiusMultiplier = player.explosionRadius;
    const playerId = player.id;

    // Speed in px/s from config with ±25% jitter for variety
    const baseSpeed = config.bulletSpeed;
    const baseRange = config.explosiveRange ?? 80;

    for (let i = 0; i < count; i++) {
      const angle = (TWO_PI / count) * i + randomRange(-0.25, 0.25);

      const speed = randomInt(baseSpeed * 0.75, baseSpeed * 1.25);
      const range = randomInt(baseRange * 0.75, baseRange * 1.25);

      const projectile = new Projectile({
        position: { x, y },
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: config.damage * damageMultiplier,
        radius: config.bulletRadius ?? 6,
        color: config.color,
        type: ProjectileType.MINI_BANANA,
        ownerId: playerId,
        explosiveRange: range,
        bulletSpeed: speed,
        weaponCategory: config.weaponCategory,
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
