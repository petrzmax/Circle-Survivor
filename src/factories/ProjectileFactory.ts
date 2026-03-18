import { WEAPON_TYPES } from '@/domain/weapons/config';
import type { ProjectileConfig } from '@/entities/Projectile';
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

/**
 * Creates ProjectileConfig objects for mini-banana projectiles.
 * Used by ExplosionSystem via entity-factories spawnProjectile.
 */
export function createMiniBananaConfigs(params: MiniBananaSpawnParams): ProjectileConfig[] {
  const config = WEAPON_TYPES.minibanana;
  const { position, damageMultiplier, explosionRadiusMultiplier, ownerId } = params;

  const count = randomInt(4, 6);
  const baseSpeed = config.bulletSpeed;
  const baseFriction = config.friction ?? 0.09;
  const configs: ProjectileConfig[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (TWO_PI / count) * i + randomRange(-0.25, 0.25);
    const speed = randomInt(baseSpeed * 0.75, baseSpeed * 1.25);
    // Randomize friction to vary travel distance (higher friction = shorter range)
    const friction = baseFriction * randomRange(0.75, 1.25);

    configs.push({
      position: { x: position.x, y: position.y },
      radius: config.bulletRadius ?? 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: config.damage * damageMultiplier,
      type: ProjectileType.MINI_BANANA,
      ownerId,
      color: config.color,
      explosiveRange: config.explosiveRange ?? 80,
      bulletSpeed: speed,
      weaponCategory: config.weaponCategory,
      friction,
      mass: config.projectileMass,
      rotation: randomRange(0, TWO_PI),
      rotationSpeed: config.rotationSpeed,
      explosive: {
        explosionRadius: (config.explosionRadius ?? 45) * explosionRadiusMultiplier,
        explosionDamage: config.damage * damageMultiplier,
        visualEffect: VisualEffect.BANANA,
      },
    });
  }

  return configs;
}
