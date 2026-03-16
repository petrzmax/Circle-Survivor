/**
 * CollisionResponseSystem — Pure routing layer.
 *
 * Reads CollisionResult (raw Entity references), dispatches to DamageSystem / DeathSystem.
 */
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { ConfigService } from '@/config/ConfigService';
import {
  Damage,
  DeployableData,
  Explosive,
  Health,
  IsBoss,
  IsDead,
  PlayerStats,
  Position,
  ProjectileData,
} from '@/ecs/traits';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { DamageSource, getExplosionOrigin } from './damage.types';
import { CollisionResult } from './CollisionSystem';
import { DamageSystem } from './DamageSystem';
import { DeathSystem } from './DeathSystem';

@singleton()
export class CollisionResponseSystem {
  private readonly bossContactDamageMultiplier: number;

  public constructor(
    private entityManager: EntityManager,
    private damageSystem: DamageSystem,
    private deathSystem: DeathSystem,
    configService: ConfigService,
  ) {
    this.bossContactDamageMultiplier = configService.getBossBalance().contactDamageMultiplier;
  }

  public processCollisions(collisions: CollisionResult, currentTime: number): void {
    const playerEntity = this.entityManager.getPlayerEntity();

    this.handlePlayerEnemyContacts(playerEntity, collisions.playerEnemyCollisions, currentTime);
    this.handlePlayerProjectiles(playerEntity, collisions.playerProjectileCollisions, currentTime);
    this.handleProjectileEnemyHits(playerEntity, collisions.projectileEnemyCollisions, currentTime);
    this.handleShockwaves(playerEntity, collisions.shockwavePlayerCollisions, currentTime);
    this.handleDeployables(playerEntity, collisions.deployableCollisions);
  }

  /** 1. Player-Enemy contact damage + thorns */
  private handlePlayerEnemyContacts(
    playerEntity: Entity,
    enemies: Entity[],
    currentTime: number,
  ): void {
    const playerStats = playerEntity.get(PlayerStats)!;

    for (const enemy of enemies) {
      const ePos = enemy.get(Position)!;
      let damage = enemy.get(Damage)!.amount;
      const isBoss = enemy.has(IsBoss);
      if (isBoss) {
        damage *= this.bossContactDamageMultiplier;
      }

      const result = this.damageSystem.damageEntity(
        playerEntity,
        damage,
        currentTime,
        ePos,
        DamageSource.ENEMY_CONTACT,
      );

      // Thorns on contact damage
      if (result.actualDamage > 0 && playerStats.thorns > 0) {
        const thornsResult = this.damageSystem.applyThorns(
          playerEntity,
          enemy,
          result.actualDamage,
          currentTime,
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
  private handlePlayerProjectiles(
    playerEntity: Entity,
    projectiles: Entity[],
    currentTime: number,
  ): void {
    const playerStats = playerEntity.get(PlayerStats)!;

    for (const proj of projectiles) {
      const pPos = proj.get(Position)!;
      const pDamage = proj.get(Damage)!.amount;
      const projectileData = proj.get(ProjectileData)!;

      const result = this.damageSystem.damageEntity(
        playerEntity,
        pDamage,
        currentTime,
        pPos,
        DamageSource.ENEMY_PROJECTILE,
      );

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
              currentTime,
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
    currentTime: number,
  ): void {
    for (const { projectile, enemy } of hits) {
      this.processProjectileHit(playerEntity, projectile, enemy, currentTime);
    }
  }

  /** 4. Shockwave damage to player */
  private handleShockwaves(
    playerEntity: Entity,
    shockwaves: CollisionResult['shockwavePlayerCollisions'],
    currentTime: number,
  ): void {
    for (const shockwave of shockwaves) {
      const result = this.damageSystem.damageEntity(
        playerEntity,
        shockwave.damage,
        currentTime,
        { x: shockwave.x, y: shockwave.y },
        DamageSource.SHOCKWAVE,
      );

      shockwave.damageDealt = true;

      if (result.isDead) {
        this.deathSystem.registerPlayerDeath();
      }
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
  private processProjectileHit(
    playerEntity: Entity,
    projectile: Entity,
    enemy: Entity,
    currentTime: number,
  ): void {
    // Skip already-dead enemies
    const eHealth = enemy.get(Health);
    if (!eHealth || eHealth.hp <= 0) return;

    const playerStats = playerEntity.get(PlayerStats)!;
    const pPos = projectile.get(Position)!;
    const projectileData = projectile.get(ProjectileData)!;
    const pDamage = projectile.get(Damage)!.amount;
    const isBoss = enemy.has(IsBoss);

    // Pre-bake offense damage: projectile damage already includes crit (from WeaponManager)
    const finalDamage = pDamage * playerStats.damageMultiplier;
    const totalKnockback = playerStats.knockback * projectileData.knockbackMultiplier;

    const result = this.damageSystem.damageEntity(
      enemy,
      finalDamage,
      currentTime,
      pPos,
      DamageSource.ENEMY_CONTACT,
      totalKnockback,
      isBoss,
    );

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

  /** Find an enemy entity by its Koota entity ID */
  private findEnemyById(entityId: number): Entity | null {
    const enemies = this.entityManager.getActiveEnemies();
    for (const e of enemies) {
      if (e.id() === entityId) return e;
    }
    return null;
  }
}
