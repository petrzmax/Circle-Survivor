/**
 * CollisionResponseSystem — Pure routing layer.
 *
 * Reads CollisionResult (raw Entity references), dispatches to DamageSystem / DeathSystem.
 */
import { ConfigService } from '@/config/ConfigService';
import {
  Collider,
  Damage,
  DeployableData,
  Explosive,
  Health,
  IsDead,
  PhysicsBody,
  PlayerStats,
  Position,
  ProjectileData,
  ShockwaveData,
  Velocity,
} from '@/ecs/traits';
import { applyImpulse, applyImpulseAwayFrom } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { circleOverlapDepth } from '@/utils/collision';
import { distance } from '@/utils/math';
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { CollisionResult } from './CollisionSystem';
import { DamageSource, getExplosionOrigin } from './damage.types';
import { DamageSystem } from './DamageSystem';
import { DeathSystem } from './DeathSystem';

@singleton()
export class CollisionResponseSystem {
  private readonly separationForce: number;
  private readonly knockbackPerMomentum: number;
  private readonly contactKnockback: number;
  private readonly shockwaveKnockback: number;

  public constructor(
    private entityManager: EntityManager,
    private damageSystem: DamageSystem,
    private deathSystem: DeathSystem,
    configService: ConfigService,
  ) {
    this.separationForce = configService.getPhysicsConfig().separationForce;
    this.knockbackPerMomentum = configService.getEnemyBalance().knockbackPerMomentum;
    this.contactKnockback = configService.getEnemyBalance().contactKnockback;
    this.shockwaveKnockback = configService.getCombatConfig().shockwaveKnockback;
  }

  public processCollisions(collisions: CollisionResult): void {
    const playerEntity = this.entityManager.getPlayerEntity();

    this.handlePlayerEnemyContacts(playerEntity, collisions.playerEnemyCollisions);
    this.handlePlayerProjectiles(playerEntity, collisions.playerProjectileCollisions);
    this.handleProjectileEnemyHits(playerEntity, collisions.projectileEnemyCollisions);
    this.handleShockwaves(playerEntity, collisions.shockwavePlayerCollisions);
    this.handleShockwaveEntityKnockback(collisions.shockwaveEntityCollisions);
    this.handleDeployables(playerEntity, collisions.deployableCollisions);
    this.handleEnemyEnemyCollisions(collisions.enemyEnemyCollisions);
  }

  /** 1. Player-Enemy contact damage + thorns */
  private handlePlayerEnemyContacts(playerEntity: Entity, enemies: Entity[]): void {
    const playerStats = playerEntity.get(PlayerStats)!;

    const playerPos = playerEntity.get(Position)!;
    const playerRadius = playerEntity.get(Collider)!.radius;

    for (const enemy of enemies) {
      const ePos = enemy.get(Position)!;
      const damage = enemy.get(Damage)!.amount;

      const result = this.damageSystem.damageEntity(
        playerEntity,
        damage,
        ePos,
        DamageSource.ENEMY_CONTACT,
      );

      // Knockback: push player away from enemy on damage
      if (result.actualDamage > 0) {
        applyImpulseAwayFrom(playerEntity, ePos, this.contactKnockback);
      }

      // Physical repulsion — push player away from enemy on overlap (works during invincibility too)
      const enemyRadius = enemy.get(Collider)!.radius;
      const overlap = circleOverlapDepth(
        { ...playerPos, radius: playerRadius },
        { ...ePos, radius: enemyRadius },
      );
      if (overlap > 0) {
        const force = overlap * this.separationForce;
        applyImpulseAwayFrom(playerEntity, ePos, force);
        applyImpulseAwayFrom(enemy, playerPos, force);
      }

      // Thorns on contact damage
      if (result.actualDamage > 0 && playerStats.thorns > 0) {
        const thornsResult = this.damageSystem.applyThorns(
          playerEntity,
          enemy,
          result.actualDamage,
        );
        if (thornsResult.isDead) {
          this.deathSystem.registerEnemyDeath(enemy);
        }
      }

      if (result.isDead) {
        this.deathSystem.registerPlayerDeath();
      }
    }
  }

  /** 2. Player hit by enemy projectiles + thorns reflected to shooter */
  private handlePlayerProjectiles(playerEntity: Entity, projectiles: Entity[]): void {
    const playerStats = playerEntity.get(PlayerStats)!;

    for (const proj of projectiles) {
      const pPos = proj.get(Position)!;
      const pDamage = proj.get(Damage)!.amount;
      const projectileData = proj.get(ProjectileData)!;

      const result = this.damageSystem.damageEntity(
        playerEntity,
        pDamage,
        pPos,
        DamageSource.ENEMY_PROJECTILE,
      );

      // Knockback: push player away from enemy projectile
      if (result.actualDamage > 0) {
        applyImpulseAwayFrom(playerEntity, pPos, this.contactKnockback);
      }

      // Mark projectile dead
      if (!proj.has(IsDead)) proj.add(IsDead);

      // Thorns on enemy projectile — reflect to the shooting enemy
      if (result.actualDamage > 0 && playerStats.thorns > 0) {
        // Find attacker entity by ownerId
        const attackerEntity = this.findEnemyById(projectileData.ownerId);
        if (attackerEntity && !attackerEntity.has(IsDead)) {
          const h = attackerEntity.get(Health);
          if (h && h.hp > 0) {
            const thornsResult = this.damageSystem.applyThorns(
              playerEntity,
              attackerEntity,
              result.actualDamage,
            );
            if (thornsResult.isDead) {
              this.deathSystem.registerEnemyDeath(attackerEntity);
            }
          }
        }
      }

      if (result.isDead) {
        this.deathSystem.registerPlayerDeath();
      }
    }
  }

  /** 3. Player projectiles hitting enemies */
  private handleProjectileEnemyHits(
    playerEntity: Entity,
    hits: Array<{ projectile: Entity; enemy: Entity }>,
  ): void {
    for (const { projectile, enemy } of hits) {
      this.processProjectileHit(playerEntity, projectile, enemy);
    }
  }

  /** 4. Shockwave damage to player */
  private handleShockwaves(
    playerEntity: Entity,
    shockwaves: CollisionResult['shockwavePlayerCollisions'],
  ): void {
    for (const shockwaveEntity of shockwaves) {
      const sd = shockwaveEntity.get(ShockwaveData)!;
      const shockwavePos = shockwaveEntity.get(Position)!;
      const damage = shockwaveEntity.get(Damage)!.amount;
      const result = this.damageSystem.damageEntity(
        playerEntity,
        damage,
        shockwavePos,
        DamageSource.SHOCKWAVE,
      );

      // Knockback: push player away from shockwave center
      if (result.actualDamage > 0) {
        applyImpulseAwayFrom(playerEntity, shockwavePos, this.contactKnockback);
      }

      sd.damageDealt = true;

      if (result.isDead) {
        this.deathSystem.registerPlayerDeath();
      }
    }
  }

  /** 4b. Shockwave ring knockback on physics entities */
  private handleShockwaveEntityKnockback(
    collisions: CollisionResult['shockwaveEntityCollisions'],
  ): void {
    for (const { shockwave, entity } of collisions) {
      const swPos = shockwave.get(Position)!;
      const sd = shockwave.get(ShockwaveData)!;
      applyImpulseAwayFrom(entity, swPos, this.shockwaveKnockback);
      sd.knockedBackEntities.add(entity.id());
    }
  }

  /** 5. Deployable triggers (mines, traps) → queue explosions */
  private handleDeployables(
    playerEntity: Entity,
    deployables: Array<{ deployable: Entity; enemies: Entity[] }>,
  ): void {
    const playerStats = playerEntity.get(PlayerStats)!;

    for (const { deployable } of deployables) {
      const deployableData = deployable.get(DeployableData)!;
      const dPos = deployable.get(Position)!;
      const explosive = deployable.get(Explosive);

      if (!explosive || explosive.radius <= 0) continue;

      // Trigger: mark dead + queue explosion
      if (!deployable.has(IsDead)) {
        deployable.add(IsDead);
      }

      EventBus.emit('queueExplosion', {
        position: dPos,
        radius: explosive.radius * playerStats.explosionRadius,
        damage: explosive.damage * playerStats.damageMultiplier,
        visualEffect: deployableData.visualEffect,
        sourceId: deployable.id(),
      });
    }
  }

  /**
   * Process a projectile hitting an enemy.
   */
  private processProjectileHit(playerEntity: Entity, projectile: Entity, enemy: Entity): void {
    // Skip already-dead enemies
    const eHealth = enemy.get(Health);
    if (!eHealth || eHealth.hp <= 0) return;

    const playerStats = playerEntity.get(PlayerStats)!;
    const pPos = projectile.get(Position)!;
    const projectileData = projectile.get(ProjectileData)!;
    const pDamage = projectile.get(Damage)!.amount;

    // Pre-bake offense damage: projectile damage already includes crit (from WeaponManager)
    const finalDamage = pDamage * playerStats.damageMultiplier;

    // Momentum-based knockback: mass × current speed
    const vel = projectile.get(Velocity)!;
    const body = projectile.get(PhysicsBody)!;
    const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    const momentum = body.mass * speed;
    const knockbackImpulse = playerStats.knockback * this.knockbackPerMomentum * momentum;

    const result = this.damageSystem.damageEntity(
      enemy,
      finalDamage,
      pPos,
      DamageSource.ENEMY_CONTACT,
    );

    // Apply momentum-based knockback to enemy
    if (result.actualDamage > 0 && knockbackImpulse > 0) {
      applyImpulseAwayFrom(enemy, pPos, knockbackImpulse);
    }

    // Lifesteal on hit
    this.damageSystem.applyLifesteal(playerEntity);

    // Register kill
    if (result.isDead) {
      this.deathSystem.registerEnemyDeath(enemy);
    }

    // Handle explosive projectiles
    if (projectileData.explosive) {
      const origin = getExplosionOrigin(projectileData.type);
      const expRadius = projectileData.explosive.explosionRadius * playerStats.explosionRadius;

      EventBus.emit('queueExplosion', {
        position: pPos,
        radius: expRadius,
        damage: projectileData.explosive.explosionDamage * playerStats.damageMultiplier,
        visualEffect: projectileData.explosive.visualEffect,
        sourceId: projectile.id(),
        origin,
        weaponLevelDamageMultiplier: projectileData.explosive.weaponLevelDamageMultiplier,
        weaponLevelExplosionMultiplier: projectileData.explosive.weaponLevelExplosionMultiplier,
      });
    }

    // Destroy non-piercing projectiles
    const canPierce = projectileData.pierce && projectileData.pierce.pierceCount > 0;
    if (!canPierce) {
      if (!projectile.has(IsDead)) projectile.add(IsDead);
    }

    EventBus.emit('projectileHit', {
      projectileId: projectile.id(),
      targetId: enemy.id(),
      position: pPos,
    });
  }

  /** 6. Enemy-enemy overlap repulsion */
  private handleEnemyEnemyCollisions(pairs: Array<{ enemyA: Entity; enemyB: Entity }>): void {
    for (const { enemyA, enemyB } of pairs) {
      const posA = enemyA.get(Position)!;
      const posB = enemyB.get(Position)!;
      const radiusA = enemyA.get(Collider)!.radius;
      const radiusB = enemyB.get(Collider)!.radius;

      const overlap = circleOverlapDepth(
        { ...posA, radius: radiusA },
        { ...posB, radius: radiusB },
      );
      if (overlap <= 0) continue;

      const dist = distance(posA, posB);
      let dx: number;
      let dy: number;

      if (dist > 0) {
        dx = (posB.x - posA.x) / dist;
        dy = (posB.y - posA.y) / dist;
      } else {
        // Exactly overlapping — use random direction to break symmetry
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      }

      const force = overlap * this.separationForce;
      applyImpulse(enemyA, { x: -dx * force, y: -dy * force });
      applyImpulse(enemyB, { x: dx * force, y: dy * force });
    }
  }

  /** Find an enemy entity by its Koota entity ID */
  private findEnemyById(entityId: number): Entity | null {
    const enemies = this.entityManager.getActiveEnemies();
    for (const e of enemies) {
      if (e.id() === entityId) return e;
    }
    return null;
  }
}
