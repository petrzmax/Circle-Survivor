/**
 * CombatSystem - Handles damage, explosions, and combat effects.
 * Processes collision results and applies damage, knockback, etc.
 */

import { EntityManager } from '@/managers/EntityManager';
import { EventBus } from '@/core/EventBus';
import { CollisionResult } from './CollisionSystem';
import { Enemy } from '@/entities/Enemy';
import { Projectile } from '@/entities/Projectile';
import { Pickup, createGoldPickup, createHealthPickup } from '@/entities/Pickup';
import { VisualEffect, PickupType, ProjectileType } from '@/types/enums';
import { WEAPON_TYPES } from '@/config/weapons.config';

/**
 * Explosion event data
 */
export interface ExplosionEvent {
  // TODO, use vector2
  x: number;
  y: number;
  radius: number;
  damage: number;
  visualEffect: VisualEffect;
  sourceId: number;
  // TODO - some enum / type instead of booleans
  isBanana?: boolean;
  isMini?: boolean;
}

/**
 * Chain lightning event data
 */
// TODO - remove everything related to chain
export interface ChainEvent {
  targets: Array<{ enemy: Enemy; damage: number }>;
  sourceProjectile: Projectile;
}

/**
 * CombatSystem configuration
 */
export interface CombatSystemConfig {
  /** Health drop chance (0-1) */
  healthDropChance?: number;
  /** Base gold per enemy */
  baseGoldDrop?: number;
}

/**
 * Handles all combat-related logic.
 * Processes damage, spawns pickups, handles explosions and chains.
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
  private healthDropChance: number;

  /** Pending explosions to process */
  private pendingExplosions: ExplosionEvent[] = [];

  constructor(entityManager: EntityManager, config: CombatSystemConfig = {}) {
    this.entityManager = entityManager;
    this.healthDropChance = config.healthDropChance ?? 0.05;
  }

  /**
   * Process all collisions from CollisionSystem
   */
  processCollisions(collisions: CollisionResult, currentTime: number): void {
    const player = this.entityManager.getPlayer();
    if (!player) return;

    // Process player-enemy collisions
    for (const enemy of collisions.playerEnemyCollisions) {
      const isDead = player.takeDamage(enemy.damage, currentTime);

      // TODO - Event types should be enums / class with static strings
      EventBus.emit('playerHit', {
        player,
        damage: enemy.damage,
        source: enemy,
      });

      if (isDead) {
        EventBus.emit('playerDeath', { player, killedBy: enemy });
      }
    }

    // Process player-projectile collisions (enemy bullets)
    for (const projectile of collisions.playerProjectileCollisions) {
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
      this.processProjectileHit(projectile, enemy, player.damageMultiplier);
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
          x: deployable.x,
          y: deployable.y,
          radius: explosionData.explosionRadius,
          damage: explosionData.explosionDamage,
          visualEffect: explosionData.visualEffect ?? VisualEffect.STANDARD,
          sourceId: deployable.id,
        });
      }
    }

    // Process any pending explosions
    this.processExplosions();
  }

  /**
   * Process a projectile hitting an enemy
   */
  private processProjectileHit(
    projectile: Projectile,
    enemy: Enemy,
    damageMultiplier: number,
  ): void {
    const player = this.entityManager.getPlayer();
    const finalDamage = projectile.damage * damageMultiplier;

    // Apply damage with knockback
    const isDead = enemy.takeDamage(finalDamage, projectile.x, projectile.y);

    EventBus.emit('enemyDamaged', {
      enemy,
      damage: finalDamage,
      source: { x: projectile.x, y: projectile.y },
    });

    // Lifesteal
    if (player && player.lifesteal > 0) {
      const healAmount = finalDamage * player.lifesteal;
      player.heal(healAmount);
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
      this.queueExplosion({
        x: projectile.x,
        y: projectile.y,
        radius: projectile.explosive.explosionRadius,
        damage: projectile.explosive.explosionDamage * damageMultiplier,
        visualEffect: projectile.explosive.visualEffect ?? VisualEffect.STANDARD,
        sourceId: projectile.id,
        isBanana,
        isMini,
      });
    }

    // Handle chain projectiles
    if (projectile.canChain() && projectile.chain) {
      this.processChainEffect(projectile, enemy, damageMultiplier);
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
   * Process chain lightning effect
   */
  private processChainEffect(
    projectile: Projectile,
    initialTarget: Enemy,
    damageMultiplier: number,
  ): void {
    if (!projectile.chain) return;

    const { chainCount, chainRange, chainedEnemies } = projectile.chain;
    let currentTarget = initialTarget;
    let remainingChains = chainCount;
    let currentDamage = projectile.damage * damageMultiplier;
    const damageDecay = 0.8; // 20% damage reduction per chain

    while (remainingChains > 0) {
      // Find next target
      const nextTarget = this.findChainTarget(
        currentTarget.x,
        currentTarget.y,
        chainRange,
        chainedEnemies,
      );

      if (!nextTarget) break;

      // Register chain
      if (!projectile.registerChain(nextTarget.id)) break;

      // Apply damage
      currentDamage *= damageDecay;
      const isDead = nextTarget.takeDamage(currentDamage, currentTarget.x, currentTarget.y);

      if (isDead) {
        this.handleEnemyDeath(nextTarget, 'chain');
      }

      currentTarget = nextTarget;
      remainingChains--;
    }
  }

  /**
   * Find next chain target
   */
  private findChainTarget(
    x: number,
    y: number,
    range: number,
    excludeIds: Set<number>,
  ): Enemy | null {
    const enemies = this.entityManager.getActiveEnemies().filter((e) => !excludeIds.has(e.id));

    let nearest: Enemy | null = null;
    let nearestDistSq = range * range;

    for (const enemy of enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Queue an explosion for processing
   */
  queueExplosion(explosion: ExplosionEvent): void {
    this.pendingExplosions.push(explosion);
  }

  /**
   * Process all pending explosions
   */
  private processExplosions(): void {
    const player = this.entityManager.getPlayer();
    const damageMultiplier = player?.damageMultiplier ?? 1;

    while (this.pendingExplosions.length > 0) {
      const explosion = this.pendingExplosions.shift()!;
      this.processExplosion(explosion, damageMultiplier);
    }
  }

  /**
   * Process a single explosion
   */
  private processExplosion(explosion: ExplosionEvent, damageMultiplier: number): void {
    const { x, y, radius, damage, visualEffect, isBanana, isMini } = explosion;

    // Find enemies in explosion radius
    const enemies = this.entityManager.getEnemiesInRadius(x, y, radius);

    for (const enemy of enemies) {
      const isDead = enemy.takeDamage(damage * damageMultiplier, x, y);

      EventBus.emit('enemyDamaged', {
        enemy,
        damage: damage * damageMultiplier,
        source: { x, y },
      });

      if (isDead) {
        this.handleEnemyDeath(enemy, 'explosion');
      }
    }

    // Banana (not mini) - spawn mini bananas
    if (isBanana && !isMini) {
      this.spawnMiniBananas(x, y, 4 + Math.floor(Math.random() * 3), damageMultiplier);
    }

    // Emit explosion event for visual effects
    EventBus.emit('explosionTriggered', {
      position: { x, y },
      radius,
      damage,
      visualEffect,
      isBanana,
    });
  }

  /**
   * Handle enemy death - spawn pickups, emit events
   */
  private handleEnemyDeath(enemy: Enemy, killer: 'player' | 'explosion' | 'chain'): void {
    enemy.destroy();

    // Spawn gold pickup
    const goldValue = Math.floor(
      enemy.goldValue * (this.entityManager.getPlayer()?.goldMultiplier ?? 1),
    );
    if (goldValue > 0) {
      const goldPickup = createGoldPickup(enemy.x, enemy.y, goldValue);
      this.entityManager.addPickup(goldPickup);
    }

    // Chance to spawn health pickup
    if (Math.random() < this.healthDropChance) {
      const healthPickup = createHealthPickup(enemy.x, enemy.y, 10);
      this.entityManager.addPickup(healthPickup);
    }

    // Handle explodeOnDeath
    if (enemy.explodeOnDeath && enemy.explosionRadius > 0) {
      this.queueExplosion({
        x: enemy.x,
        y: enemy.y,
        radius: enemy.explosionRadius,
        damage: enemy.explosionDamage,
        visualEffect: VisualEffect.FIRE,
        sourceId: enemy.id,
      });
    }

    // Handle splitOnDeath (spawning handled by SpawnSystem via event)
    // Just emit the event, SpawnSystem will handle creating new enemies

    EventBus.emit('enemyDeath', {
      enemy,
      killer,
      position: { x: enemy.x, y: enemy.y },
    });
  }

  /**
   * Process pickup collection
   */
  private processPickupCollection(pickup: Pickup): void {
    const value = pickup.collect();
    const player = this.entityManager.getPlayer();

    if (pickup.type === PickupType.GOLD) {
      EventBus.emit('goldCollected', {
        amount: value,
        position: { x: pickup.x, y: pickup.y },
      });
    } else if (pickup.type === PickupType.HEALTH) {
      if (player) {
        player.heal(value);
      }
      EventBus.emit('healthCollected', {
        amount: value,
        position: { x: pickup.x, y: pickup.y },
      });
    }
  }

  /**
   * Apply damage to player directly (for special cases)
   */
  applyDamageToPlayer(damage: number, currentTime: number): boolean {
    const player = this.entityManager.getPlayer();
    if (!player) return false;

    return player.takeDamage(damage, currentTime);
  }

  /**
   * Apply damage to all enemies in area
   */
  applyAreaDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    visualEffect: VisualEffect = VisualEffect.STANDARD,
  ): void {
    this.queueExplosion({
      x,
      y,
      radius,
      damage,
      visualEffect,
      sourceId: -1,
    });
    this.processExplosions();
  }

  /**
   * Set health drop chance
   */
  setHealthDropChance(chance: number): void {
    this.healthDropChance = Math.max(0, Math.min(1, chance));
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
      const angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.5;

      // Random speed (6-10) and distance (60-100px) for each mini banana
      const randomSpeed = 6 + Math.random() * 4;
      const randomRange = 60 + Math.random() * 40;

      const projectile = new Projectile({
        x,
        y,
        vx: Math.cos(angle) * randomSpeed,
        vy: Math.sin(angle) * randomSpeed,
        damage: config.damage * damageMultiplier,
        radius: config.bulletRadius ?? 6,
        color: config.color,
        type: ProjectileType.MINI_BANANA,
        ownerId: playerId,
        maxDistance: randomRange,
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
