import { WEAPON_TYPES } from '@/domain/weapons/config';
import { Projectile } from '@/entities/Projectile';
import { ProjectileType, VisualEffect } from '@/types/enums';
import { Vector2, TWO_PI } from '@/utils/math';
import { randomInt, randomRange } from '@/utils/random';

export interface MiniBananaSpawnParams {
  /** Center of the banana explosion */
  position: Vector2;
  /** Player's damage multiplier (pre-baked into projectile damage) */
  damageMultiplier: number;
  /** Player's explosion radius multiplier */
  explosionRadiusMultiplier: number;
  /** Owner entity ID (player) */
  ownerId: number;
}

export interface SingleMiniBananaParams {
  position: Vector2;
  angle: number;
  speed: number;
  range: number;
  damageMultiplier: number;
  explosionRadiusMultiplier: number;
  ownerId: number;
}

/**
 * Creates a single mini-banana projectile with the given trajectory.
 */
export function createMiniBanana(params: SingleMiniBananaParams): Projectile {
  const config = WEAPON_TYPES.minibanana;
  const { position, angle, speed, range, damageMultiplier, explosionRadiusMultiplier, ownerId } =
    params;

  return new Projectile({
    position: { x: position.x, y: position.y },
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage: config.damage * damageMultiplier,
    radius: config.bulletRadius ?? 6,
    color: config.color,
    type: ProjectileType.MINI_BANANA,
    ownerId,
    explosiveRange: range,
    bulletSpeed: speed,
    weaponCategory: config.weaponCategory,
    explosive: {
      explosionRadius: (config.explosionRadius ?? 45) * explosionRadiusMultiplier,
      explosionDamage: config.damage * damageMultiplier,
      visualEffect: VisualEffect.BANANA,
    },
  });
}

/**
 * Creates mini-banana projectiles that scatter from a banana explosion.
 *
 * @returns Array of mini-banana projectiles to add to EntityManager
 */
export function createMiniBananas(params: MiniBananaSpawnParams): Projectile[] {
  const config = WEAPON_TYPES.minibanana;
  const { position, damageMultiplier, explosionRadiusMultiplier, ownerId } = params;

  const count = randomInt(4, 6);
  const baseSpeed = config.bulletSpeed;
  const baseRange = config.explosiveRange ?? 80;
  const projectiles: Projectile[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (TWO_PI / count) * i + randomRange(-0.25, 0.25);
    const speed = randomInt(baseSpeed * 0.75, baseSpeed * 1.25);
    const range = randomInt(baseRange * 0.75, baseRange * 1.25);

    projectiles.push(
      createMiniBanana({
        position,
        angle,
        speed,
        range,
        damageMultiplier,
        explosionRadiusMultiplier,
        ownerId,
      }),
    );
  }

  return projectiles;
}
