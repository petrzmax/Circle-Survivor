import { singleton } from 'tsyringe';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { createMiniBananas } from '@/factories/ProjectileFactory';
import { distance, Vector2 } from '@/utils/math';
import { CombatMath } from '@/utils/combat-math';
import { DamageSource, ExplosionOrigin } from './damage.types';
import { DamageSystem } from './DamageSystem';
import { DeathSystem } from './DeathSystem';
import type { ExplosionEvent } from './damage.types';

/** Maximum iterations for the death→explosion chain resolution loop */
const MAX_CHAIN_ITERATIONS = 10;

@singleton()
export class ExplosionSystem {
  private pendingExplosions: ExplosionEvent[] = [];
  /** Banana explosion origins queued for mini-banana spawning after chain completes */
  private pendingMiniBananaSpawns: ExplosionEvent[] = [];

  public constructor(
    private entityManager: EntityManager,
    private damageSystem: DamageSystem,
    private deathSystem: DeathSystem,
    private combatMath: CombatMath,
  ) {
    EventBus.on('queueExplosion', (data) => {
      this.pendingExplosions.push(data);
    });
  }

  public hasPendingExplosions(): boolean {
    return this.pendingExplosions.length > 0;
  }

  /**
   * Drain and resolve the death↔explosion chain.
   * Alternates between DeathSystem and ExplosionSystem until both are quiet.
   * After chain resolution, spawns mini-bananas from banana explosions.
   */
  public resolveChain(currentTime: number): void {
    let iterations = 0;
    while (
      (this.hasPendingExplosions() || this.deathSystem.hasPendingDeaths()) &&
      iterations < MAX_CHAIN_ITERATIONS
    ) {
      this.deathSystem.processDeaths();
      this.processExplosions(currentTime);
      iterations++;
    }

    this.spawnPendingMiniBananas();
  }

  /**
   * Process all pending explosions.
   */
  private processExplosions(currentTime: number): void {
    const killedThisBatch = new Set<number>();

    while (this.pendingExplosions.length > 0) {
      const explosion = this.pendingExplosions.shift()!;
      this.processExplosion(explosion, currentTime, killedThisBatch);
    }
  }

  /**
   * Process a single explosion — AOE damage with distance falloff.
   */
  private processExplosion(
    explosion: ExplosionEvent,
    currentTime: number,
    killedThisBatch: Set<number>,
  ): void {
    const { position, radius, damage, isEnemyExplosion } = explosion;

    if (isEnemyExplosion) {
      this.damagePlayerFromExplosion(position, radius, damage, currentTime);
    }

    this.damageEnemiesFromExplosion(position, radius, damage, currentTime, killedThisBatch);

    // Track banana explosions for mini-banana spawning after chain resolution
    if (explosion.origin === ExplosionOrigin.BANANA) {
      this.pendingMiniBananaSpawns.push(explosion);
    }

    EventBus.emit('explosionProcessed', explosion);
  }

  /** Spawn mini-banana projectiles for all banana explosions collected during the chain. */
  private spawnPendingMiniBananas(): void {
    while (this.pendingMiniBananaSpawns.length > 0) {
      const explosion = this.pendingMiniBananaSpawns.shift()!;
      const player = this.entityManager.getPlayer();

      const projectiles = createMiniBananas({
        position: explosion.position,
        damageMultiplier: player.damageMultiplier,
        explosionRadiusMultiplier: player.explosionRadius,
        ownerId: player.id,
      });

      for (const projectile of projectiles) {
        this.entityManager.addProjectile(projectile);
      }
    }
  }

  /** Apply explosion damage to the player (enemy explosions only). */
  private damagePlayerFromExplosion(
    position: Vector2,
    radius: number,
    damage: number,
    currentTime: number,
  ): void {
    const player = this.entityManager.getPlayer();
    if (!player.isActive) return;

    const distToPlayer = distance(player.position, position);
    if (distToPlayer > radius) return;

    const effectiveDist = Math.max(0, distToPlayer - player.radius);
    const falloffMultiplier = this.combatMath.explosionFalloff(effectiveDist, radius);
    const finalDamage = Math.max(1, Math.round(damage * falloffMultiplier));

    const result = this.damageSystem.damageEntity(
      player,
      finalDamage,
      currentTime,
      position,
      DamageSource.EXPLOSION,
      1,
      false,
      true,
    );

    if (result.isDead) {
      this.deathSystem.registerPlayerDeath();
    }
  }

  /** Apply explosion damage to all enemies in radius with distance falloff. */
  private damageEnemiesFromExplosion(
    position: Vector2,
    radius: number,
    damage: number,
    currentTime: number,
    killedThisBatch: Set<number>,
  ): void {
    const hits = this.entityManager.getEnemiesInRadius(position, radius);

    for (const { enemy, dist } of hits) {
      if (killedThisBatch.has(enemy.id) || enemy.isDead()) continue;

      const effectiveDist = Math.max(0, dist - enemy.radius);
      const falloffMultiplier = this.combatMath.explosionFalloff(effectiveDist, radius);
      const finalDamage = Math.max(1, Math.round(damage * falloffMultiplier));

      const result = this.damageSystem.damageEntity(
        enemy,
        finalDamage,
        currentTime,
        position,
        DamageSource.EXPLOSION,
        0, // No knockback from explosions (direction is ambiguous in radial AOE)
        enemy.isBoss,
      );

      if (result.isDead) {
        killedThisBatch.add(enemy.id);
        this.deathSystem.registerEnemyDeath(enemy);
      }
    }
  }
}
