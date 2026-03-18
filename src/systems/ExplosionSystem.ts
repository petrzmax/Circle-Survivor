import { singleton } from 'tsyringe';
import { Collider, Health, IsDead, IsPlayer, PlayerStats, Position } from '@/ecs/traits';
import { spawnProjectile } from '@/ecs/factories/entity-factories';
import { applyImpulseAwayFrom } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { createMiniBananaConfigs } from '@/factories/ProjectileFactory';
import { distance, distanceSquared, Vector2 } from '@/utils/math';
import { CombatMath } from '@/utils/combat-math';
import { ConfigService } from '@/config/ConfigService';
import { DamageSource, ExplosionOrigin } from './damage.types';
import { DamageSystem } from './DamageSystem';
import { DeathSystem } from './DeathSystem';
import type { ExplosionEvent } from './damage.types';

const MAX_CHAIN_ITERATIONS = 10;

@singleton()
export class ExplosionSystem {
  private pendingExplosions: ExplosionEvent[] = [];
  private pendingMiniBananaSpawns: ExplosionEvent[] = [];
  public constructor(
    private entityManager: EntityManager,
    private damageSystem: DamageSystem,
    private deathSystem: DeathSystem,
    private combatMath: CombatMath,
    private configService: ConfigService,
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

  private processExplosions(currentTime: number): void {
    const killedThisBatch = new Set<number>();

    while (this.pendingExplosions.length > 0) {
      const explosion = this.pendingExplosions.shift()!;
      this.processExplosion(explosion, currentTime, killedThisBatch);
    }
  }

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
    this.applyExplosionKnockbackToAll(position, radius);

    // Track banana explosions for mini-banana spawning after chain resolution
    if (explosion.origin === ExplosionOrigin.BANANA) {
      this.pendingMiniBananaSpawns.push(explosion);
    }

    EventBus.emit('explosionProcessed', explosion);
  }

  private spawnPendingMiniBananas(): void {
    while (this.pendingMiniBananaSpawns.length > 0) {
      const explosion = this.pendingMiniBananaSpawns.shift()!;
      const playerEntity = this.entityManager.getPlayerEntity();
      const playerStats = playerEntity.get(PlayerStats)!;

      const configs = createMiniBananaConfigs({
        position: explosion.position,
        damageMultiplier: playerStats.damageMultiplier,
        explosionRadiusMultiplier: playerStats.explosionRadius,
        ownerId: playerEntity.id(),
      });

      for (const config of configs) {
        spawnProjectile(config);
      }
    }
  }

  private damagePlayerFromExplosion(
    position: Vector2,
    radius: number,
    damage: number,
    currentTime: number,
  ): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    if (playerEntity.has(IsDead)) return;

    const pPos = playerEntity.get(Position)!;
    const pRadius = playerEntity.get(Collider)!.radius;
    const distToPlayer = distance(pPos, position);
    if (distToPlayer > radius) return;

    const effectiveDist = Math.max(0, distToPlayer - pRadius);
    const falloffMultiplier = this.combatMath.explosionFalloff(effectiveDist, radius);
    const finalDamage = Math.max(1, Math.round(damage * falloffMultiplier));

    const result = this.damageSystem.damageEntity(
      playerEntity,
      finalDamage,
      currentTime,
      position,
      DamageSource.EXPLOSION,
    );

    if (result.isDead) {
      this.deathSystem.registerPlayerDeath();
    }
  }

  private damageEnemiesFromExplosion(
    position: Vector2,
    radius: number,
    damage: number,
    currentTime: number,
    killedThisBatch: Set<number>,
  ): void {
    const radiusSq = radius * radius;
    const enemies = this.entityManager.getActiveEnemies();

    for (const enemy of enemies) {
      const ePos = enemy.get(Position)!;
      const dSq = distanceSquared(ePos, position);
      if (dSq > radiusSq) continue;

      const id = enemy.id();
      if (killedThisBatch.has(id)) continue;

      const eHealth = enemy.get(Health);
      if (!eHealth || eHealth.hp <= 0) continue;

      const dist = Math.sqrt(dSq);
      const eRadius = enemy.get(Collider)!.radius;
      const effectiveDist = Math.max(0, dist - eRadius);
      const falloffMultiplier = this.combatMath.explosionFalloff(effectiveDist, radius);
      const finalDamage = Math.max(1, Math.round(damage * falloffMultiplier));

      const result = this.damageSystem.damageEntity(
        enemy,
        finalDamage,
        currentTime,
        position,
        DamageSource.EXPLOSION,
        0,
      );

      if (result.isDead) {
        killedThisBatch.add(id);
        this.deathSystem.registerEnemyDeath(enemy);
      }
    }
  }

  /**
   * Apply explosion knockback to ALL entities with PhysicsBody (enemies, pickups, etc.).
   * Damage is handled separately — this only applies impulse forces.
   */
  private applyExplosionKnockbackToAll(position: Vector2, radius: number): void {
    const radiusSq = radius * radius;
    const explosionKnockback = this.configService.getCombatConfig().explosionKnockback;
    const entities = this.entityManager.getKnockbackableEntities();

    for (const entity of entities) {
      if (entity.has(IsPlayer)) continue;

      const ePos = entity.get(Position)!;
      const dSq = distanceSquared(ePos, position);
      if (dSq > radiusSq) continue;

      const dist = Math.sqrt(dSq);
      const eRadius = entity.get(Collider)!.radius;
      const effectiveDist = Math.max(0, dist - eRadius);
      const falloffMultiplier = this.combatMath.explosionFalloff(effectiveDist, radius);

      applyImpulseAwayFrom(entity, position, explosionKnockback * falloffMultiplier);
    }
  }
}
