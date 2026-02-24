/**
 * CollisionResponseSystem — Pure routing layer.
 *
 * Reads CollisionResult, dispatches to DamageSystem / ExplosionSystem / DeathSystem.
 */
import { singleton } from 'tsyringe';
import { ConfigService } from '@/config/ConfigService';
import { Enemy } from '@/domain/enemies';
import { Player } from '@/domain/player';
import { EventBus } from '@/events/EventBus';
import { Projectile } from '@/entities/Projectile';
import { EntityManager } from '@/managers/EntityManager';
import { VisualEffect } from '@/types/enums';
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

  /**
   * Process all collisions from CollisionSystem.
   * Routes each collision type to the appropriate system.
   */
  public processCollisions(collisions: CollisionResult, currentTime: number): void {
    const player = this.entityManager.getPlayer();

    this.handlePlayerEnemyContacts(player, collisions.playerEnemyCollisions, currentTime);
    this.handlePlayerProjectiles(player, collisions.playerProjectileCollisions, currentTime);
    this.handleProjectileEnemyHits(collisions.projectileEnemyCollisions, currentTime);
    this.handleShockwaves(player, collisions.shockwavePlayerCollisions, currentTime);
    this.handleDeployables(player, collisions.deployableCollisions);
  }

  /** 1. Player-Enemy contact damage + thorns */
  private handlePlayerEnemyContacts(
    player: Player,
    enemies: CollisionResult['playerEnemyCollisions'],
    currentTime: number,
  ): void {
    for (const enemy of enemies) {
      let damage = enemy.damage;
      if (enemy.isBoss) {
        damage *= this.bossContactDamageMultiplier;
      }

      const result = this.damageSystem.damageEntity(
        player,
        damage,
        currentTime,
        enemy.position,
        DamageSource.ENEMY_CONTACT,
        1,
        false,
        true,
      );

      // Thorns on contact damage
      if (result.actualDamage > 0 && player.thorns > 0) {
        const thornsResult = this.damageSystem.applyThorns(
          player,
          enemy,
          result.actualDamage,
          currentTime,
          enemy.isBoss,
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
    player: Player,
    projectiles: CollisionResult['playerProjectileCollisions'],
    currentTime: number,
  ): void {
    for (const projectile of projectiles) {
      const result = this.damageSystem.damageEntity(
        player,
        projectile.damage,
        currentTime,
        projectile.position,
        DamageSource.ENEMY_PROJECTILE,
        1,
        false,
        true,
      );

      projectile.destroy();

      // Thorns on enemy projectile — reflect to the shooting enemy
      if (result.actualDamage > 0 && player.thorns > 0) {
        const attacker = this.entityManager.getEnemy(projectile.ownerId);
        if (attacker && !attacker.isDead()) {
          const thornsResult = this.damageSystem.applyThorns(
            player,
            attacker,
            result.actualDamage,
            currentTime,
            attacker.isBoss,
          );
          if (thornsResult.isDead) {
            this.deathSystem.registerEnemyDeath(attacker);
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
    hits: CollisionResult['projectileEnemyCollisions'],
    currentTime: number,
  ): void {
    for (const { projectile, enemy } of hits) {
      this.processProjectileHit(projectile, enemy, currentTime);
    }
  }

  /** 4. Shockwave damage to player */
  private handleShockwaves(
    player: Player,
    shockwaves: CollisionResult['shockwavePlayerCollisions'],
    currentTime: number,
  ): void {
    for (const shockwave of shockwaves) {
      const result = this.damageSystem.damageEntity(
        player,
        shockwave.damage,
        currentTime,
        { x: shockwave.x, y: shockwave.y },
        DamageSource.SHOCKWAVE,
        1,
        false,
        true,
      );

      shockwave.damageDealt = true;

      // Thorns on shockwave — no traceable attacker entity, skip thorns

      if (result.isDead) {
        this.deathSystem.registerPlayerDeath();
      }
    }
  }

  /** 5. Deployable triggers (mines, traps) → queue explosions */
  private handleDeployables(
    player: Player,
    deployables: CollisionResult['deployableCollisions'],
  ): void {
    for (const { deployable } of deployables) {
      const explosionData = deployable.trigger();
      if (explosionData) {
        EventBus.emit('queueExplosion', {
          position: deployable.position,
          radius: explosionData.explosionRadius * player.explosionRadius,
          damage: explosionData.explosionDamage * player.damageMultiplier,
          visualEffect: explosionData.visualEffect ?? VisualEffect.STANDARD,
          sourceId: deployable.id,
        });
      }
    }
  }

  /**
   * Process a projectile hitting an enemy.
   * Pre-bakes offense multipliers, delegates defense to DamageSystem.
   */
  private processProjectileHit(projectile: Projectile, enemy: Enemy, currentTime: number): void {
    // Skip already-dead enemies (prevents double kill from shotgun pellets in same frame)
    if (enemy.isDead()) return;

    const player = this.entityManager.getPlayer();

    // Pre-bake offense damage: projectile.damage already includes crit (from WeaponManager)
    const finalDamage = projectile.damage * player.damageMultiplier;
    const totalKnockback = player.knockback * projectile.knockbackMultiplier;

    const result = this.damageSystem.damageEntity(
      enemy,
      finalDamage,
      currentTime,
      projectile.position,
      DamageSource.ENEMY_CONTACT, // reusing — it's player-to-enemy damage
      totalKnockback,
      enemy.isBoss,
    );

    // Lifesteal on hit
    this.damageSystem.applyLifesteal(player);

    // Register kill
    if (result.isDead) {
      this.deathSystem.registerEnemyDeath(enemy);
    }

    // Handle explosive projectiles
    if (projectile.isExplosive() && projectile.explosive) {
      const origin = getExplosionOrigin(projectile.type);
      const expRadius = projectile.explosive.explosionRadius * player.explosionRadius;

      // Pre-bake explosion damage with player multiplier
      EventBus.emit('queueExplosion', {
        position: projectile.position,
        radius: expRadius,
        damage: projectile.explosive.explosionDamage * player.damageMultiplier,
        visualEffect: projectile.explosive.visualEffect,
        sourceId: projectile.id,
        origin,
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
}
