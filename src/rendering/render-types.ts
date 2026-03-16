/**
 * Render data interfaces — plain objects decoupling renderers from ECS/adapters.
 * RenderSystem builds these from Koota traits; renderers consume them.
 */

import type { DeployableType, PickupType, ProjectileType } from '@/types/enums';
import type { WeaponType } from '@/domain/weapons';

// ============ Enemy ============

export interface EnemyRenderData {
  x: number;
  y: number;
  radius: number;
  color: string;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  phasing: boolean;
  explodeOnDeath: boolean;
  hasTopHealthBar: boolean;
  bossName: string | null;
}

// ============ Player ============

export interface PlayerRenderData {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  armor: number;
  invincibleUntil: number;
}

// ============ Projectile ============

export interface ProjectileRenderData {
  x: number;
  y: number;
  radius: number;
  type: ProjectileType;
  color: string;
  isCrit: boolean;
  rotation: number;
  vx: number;
  vy: number;
  distanceTraveled: number;
  maxDistance: number;
}

// ============ Pickup ============

export interface PickupRenderData {
  x: number;
  y: number;
  radius: number;
  type: PickupType;
  scale: number;
}

// ============ Deployable ============

export interface DeployableRenderData {
  x: number;
  y: number;
  radius: number;
  type: DeployableType;
  isArmed: boolean;
  blinkOffset: number;
}

// ============ Weapon Overlay ============

export interface WeaponRenderData {
  x: number;
  y: number;
  angle: number;
  type: WeaponType;
  level: number;
}

// ============ HUD Boss ============

export interface BossRenderData {
  type: string;
  name: string;
  hp: number;
  maxHp: number;
}
