/**
 * Entity spawn factories — create Koota entities directly without adapters.
 * Each function spawns an entity with the appropriate traits and returns it.
 */
// TODO overall i don't like this god factory. it should be splited per other factories

import type { Entity } from 'koota';
import { ENEMY_TYPES } from '@/domain/enemies/config';
import { generateBossName } from '@/domain/enemies/name';
import type { EnemyEntityConfig } from '@/domain/enemies/type';
import type { DeployableConfig, PickupConfig } from '@/types/common';
import type { ProjectileConfig } from '@/entities/Projectile';
import type { PlayerConfig } from '@/domain/player/type';
import { CHARACTER_TYPES } from '@/config/characters.config';
import { GAME_BALANCE } from '@/config';
import { CharacterType, PickupType, ProjectileType, VisualEffect } from '@/types/enums';
import { randomAngle, randomInt } from '@/utils';
import {
  Collider,
  Damage,
  DeployableData,
  DropsPickup,
  EnemyData,
  Explosive,
  Health,
  IsArmed,
  IsBoss,
  IsDeployable,
  IsEnemy,
  IsPickup,
  IsPlayer,
  IsPlayerOwned,
  IsProjectile,
  Lifetime,
  PhysicsBody,
  PickupData,
  PlayerCharacter,
  PlayerStats,
  Position,
  ProjectileData,
  Velocity,
  WeaponInventory,
} from '@/ecs/traits';
import { Time, world } from '@/ecs/world';

// ============ Projectile ============

export function spawnProjectile(config: ProjectileConfig): Entity {
  const isPlayerProjectile = config.type !== ProjectileType.ENEMY_BULLET;

  return world.spawn(
    IsProjectile,
    ...(isPlayerProjectile ? [IsPlayerOwned] : []),
    PhysicsBody({ friction: config.friction ?? 0 }),
    Position({ x: config.position.x, y: config.position.y }),
    Velocity({ vx: config.vx ?? 0, vy: config.vy ?? 0 }),
    Collider({ radius: config.radius }),
    Damage({ amount: config.damage }),
    Lifetime({ remaining: config.lifetime ?? Infinity }),
    ProjectileData({
      type: config.type,
      ownerId: config.ownerId,
      color: config.color ?? '#ffff00',
      distanceTraveled: 0,
      maxDistance: config.maxDistance ?? 0,
      isCrit: false,
      knockbackMultiplier: 1,
      weaponCategory: config.weaponCategory ?? 'gun',
      explosiveRange: config.explosiveRange ?? 0,
      baseSpeed: config.bulletSpeed ?? 0,
      shouldExplodeOnExpire: false,
      spawnPosition: { x: config.position.x, y: config.position.y },
      explosive: config.explosive ? { ...config.explosive } : null,
      pierce: config.pierce
        ? { pierceCount: config.pierce.pierceCount, hitEnemies: new Set() }
        : null,
      rotation: 0,
      rotationSpeed: config.rotationSpeed ?? 0,
      returnToOwner: config.returnToOwner ?? false,
      isReturning: false,
    }),
  );
}

// ============ Deployable ============

export function spawnDeployable(config: DeployableConfig): Entity {
  const startArmed = (config.armingTime ?? 0.5) <= 0;

  // TODO in case of testing, this.entityManager.spawn() i think that i should be wrapped like this
  const entity = world.spawn(
    IsDeployable,
    IsPlayerOwned,
    Position({ x: config.position.x, y: config.position.y }),
    Collider({ radius: config.radius }),
    Damage({ amount: config.damage }),
    Lifetime({ remaining: config.lifetime ?? Infinity }),
    Explosive({
      radius: config.explosionRadius ?? 0,
      damage: config.explosionDamage ?? config.damage,
      visualEffect: config.visualEffect ?? VisualEffect.STANDARD,
    }),
    DeployableData({
      type: config.type,
      ownerId: config.ownerId,
      color: config.color ?? '#333333',
      triggerRadius: config.triggerRadius ?? config.radius * 2,
      armingTime: config.armingTime ?? 0.5,
      animationTime: 0,
      blinkOffset: randomInt(0, 1000),
      visualEffect: config.visualEffect ?? VisualEffect.STANDARD,
    }),
  );

  if (startArmed) {
    entity.add(IsArmed);
  }

  return entity;
}

// ============ Pickup ============

// TODO move to pickup Factory as private method
export function spawnPickup(config: PickupConfig): Entity {
  const defaultLifetime = config.lifetime ?? (config.type === PickupType.GOLD ? 3 : 15);

  return world.spawn(
    IsPickup,
    Position({ x: config.position.x, y: config.position.y }),
    Velocity(),
    Collider({ radius: 8 }),
    Lifetime({ remaining: defaultLifetime }),
    PhysicsBody({
      mass: GAME_BALANCE.pickup.mass,
      friction: GAME_BALANCE.pickup.friction,
    }),
    PickupData({
      type: config.type,
      value: config.value,
      animationOffset: randomAngle(),
      shrinkDuration: 1,
      spawnTime: world.get(Time)?.elapsed ?? 0,
      attractionStartTime: 0,
    }),
  );
}

// ============ Enemy ============

export function spawnEnemy(entityConfig: EnemyEntityConfig): Entity {
  const config = ENEMY_TYPES[entityConfig.type];
  const scale = entityConfig.scale ?? 1;
  const isBoss = config.isBoss ?? false;
  const radius = config.radius * scale;

  const hp = Math.floor(config.hp * scale);
  const damage = Math.floor(config.damage * scale);

  const traits = [
    IsEnemy,
    Position({ x: entityConfig.position.x, y: entityConfig.position.y }),
    Velocity(),
    Collider({ radius }),
    Health({ hp, maxHp: hp }),
    PhysicsBody({
      mass: config.mass ?? (isBoss ? GAME_BALANCE.boss.mass : GAME_BALANCE.enemy.mass),
      friction: 0.2,
    }),
    Damage({ amount: damage }),
    DropsPickup({
      goldValue: Math.floor(config.goldValue * scale),
    }),
    EnemyData({
      type: entityConfig.type,
      config,
      color: config.color,
      speed: config.speed,
      xpValue: Math.floor(config.xpValue * scale),
      goldValue: Math.floor(config.goldValue * scale),
      scale,
      bossName: isBoss ? generateBossName() : null,
      hasTopHealthBar: isBoss,
      phasing: config.phasing ?? false,
      zigzag: config.zigzag ?? false,
      explodeOnDeath: config.explodeOnDeath ?? false,
      explosionRadius: (config.explosionRadius ?? 0) * scale,
      explosionDamage: Math.floor((config.explosionDamage ?? 0) * scale),
      splitOnDeath: config.splitOnDeath ?? false,
      splitCount: config.splitCount ?? 0,
      canShoot: config.canShoot ?? false,
      fireRate: config.fireRate ?? 2000,
      bulletSpeed: config.bulletSpeed ?? 240,
      bulletDamage: Math.floor((config.bulletDamage ?? 15) * scale),
      attackPatterns: config.attackPatterns ?? ['single'],
      nextFireTime: 0,
      zigzagTimer: 0,
      zigzagDir: 1,
      hasEnteredArena: false,
    }),
  ];

  if (isBoss) {
    traits.push(IsBoss);
  }

  return world.spawn(...traits);
}

// ============ Player ============

export function spawnPlayer(config: PlayerConfig): Entity {
  const characterType = config.characterType ?? CharacterType.NORMIK;
  const characterConfig = CHARACTER_TYPES[characterType];
  const maxHp = characterConfig.maxHp;

  return world.spawn(
    IsPlayer,
    Position({ x: config.x, y: config.y }),
    Velocity(),
    Collider({ radius: 15 }),
    Health({ hp: maxHp, maxHp }),
    PlayerCharacter({
      characterType,
      color: characterConfig.color,
      width: 30,
      height: 30,
      characterConfig,
    }),
    PlayerStats({
      gold: 0,
      xp: 0,
      speedMultiplier: 1,
      pickupRange: 50,
      armor: 0,
      damageMultiplier: characterConfig.damageMultiplier,
      attackSpeedMultiplier: 1,
      critChance: 0,
      critDamage: GAME_BALANCE.player.baseCritMultiplier,
      lifesteal: 0,
      knockback: 1,
      explosionRadius: 1,
      projectileCount: 0,
      pierce: 0,
      attackRange: 1,
      luck: 0,
      xpMultiplier: 1,
      goldMultiplier: characterConfig.goldMultiplier,
      dodge: 0,
      thorns: 0,
      regen: 0,
      healthDropChance: GAME_BALANCE.drops.healthDropChance,
      healthDropValue: GAME_BALANCE.drops.healthDropValue,
      healthDropLuckMultiplier: GAME_BALANCE.drops.healthDropLuckMultiplier,
      godMode: false,
      maxWeapons: 6,
      invincibleUntil: 0,
      invincibilityDuration: GAME_BALANCE.player.invincibilityMs,
      currentTarget: null,
    }),
    WeaponInventory({
      weapons: [],
      items: [],
    }),
  );
}
