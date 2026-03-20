/**
 * ProjectileRenderer - Renders projectiles based on their type.
 * Separates rendering logic from entity logic.
 */

import { ProjectileType } from '@/types/enums';
import { randomRange } from '@/utils';
import { normalize, TWO_PI } from '@/utils/math';
import type { ProjectileRenderData } from './render-types';

/**
 * Renders a projectile to the canvas based on its type.
 */
export function renderProjectile(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.save();
  ctx.translate(p.x, p.y);

  switch (p.type) {
    case ProjectileType.NUKE:
      renderNuke(ctx, p);
      break;
    case ProjectileType.SCYTHE:
      renderScythe(ctx, p);
      break;
    case ProjectileType.SWORD:
      renderSword(ctx, p);
      break;
    case ProjectileType.HOLY_GRENADE:
      renderHolyGrenade(ctx, p);
      break;
    case ProjectileType.BANANA:
    case ProjectileType.MINI_BANANA:
      renderBanana(ctx, p);
      break;
    case ProjectileType.CROSSBOW_BOLT:
      renderCrossbowBolt(ctx, p);
      break;
    case ProjectileType.ROCKET:
      renderRocket(ctx, p);
      break;
    case ProjectileType.FLAMETHROWER:
      renderFlame(ctx, p);
      break;
    case ProjectileType.ENEMY_BULLET:
      renderEnemyBullet(ctx, p);
      break;
    case ProjectileType.BOSS_BULLET:
      renderBossBullet(ctx, p);
      break;
    default:
      renderStandardBullet(ctx, p);
  }

  ctx.restore();
}

/**
 * Standard bullet - simple colored circle with glow
 */
function renderStandardBullet(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);
  ctx.fillStyle = p.color;
  ctx.fill();

  // Crit indicator
  if (p.isCrit) {
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
  }
  ctx.fill();
}

/**
 * Nuke - large glowing green ball
 */
function renderNuke(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#004400');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowColor = '#00ff00';
  ctx.shadowBlur = 20;
  ctx.fill();
}

/**
 * Scythe - rotating crescent (uses projectile's rotation property)
 */
function renderScythe(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.rotate(p.rotation);

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.arc(p.radius * 0.3, 0, p.radius * 0.7, 1.8 * Math.PI, 0.2 * Math.PI, true);
  ctx.fillStyle = p.color;
  ctx.fill();
}

/**
 * Sword - swift slash shape
 */
function renderSword(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.rotate(Math.atan2(p.vy, p.vx));

  ctx.beginPath();
  ctx.moveTo(-p.radius, 0);
  ctx.lineTo(p.radius, -3);
  ctx.lineTo(p.radius + 5, 0);
  ctx.lineTo(p.radius, 3);
  ctx.closePath();

  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Holy Grenade - golden ball with cross
 */
function renderHolyGrenade(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(1, '#b8860b');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Cross
  ctx.strokeStyle = '#8b0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.moveTo(-4, -1);
  ctx.lineTo(4, -1);
  ctx.stroke();

  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 15;
}

/**
 * Banana - rotating yellow crescent
 */
function renderBanana(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.rotate(p.rotation);

  ctx.beginPath();
  ctx.arc(0, -5, p.radius, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffff00';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#cccc00';
  ctx.stroke();
}

/**
 * Crossbow Bolt - arrow shape with glowing hook
 */
function renderCrossbowBolt(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.rotate(Math.atan2(p.vy, p.vx));

  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(-p.radius, 0);
  ctx.lineTo(p.radius, 0);
  ctx.lineTo(p.radius + 4, -2);
  ctx.moveTo(p.radius, 0);
  ctx.lineTo(p.radius + 4, 2);
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Glowing hook (cyan)
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(p.radius, 0, 3, 0, TWO_PI);
  ctx.fill();
}

/**
 * Rocket - bazooka rocket with flame trail
 */
function renderRocket(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  // Body with gradient
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
  gradient.addColorStop(0, '#ffff00');
  gradient.addColorStop(0.7, '#ff4400');
  gradient.addColorStop(1, '#aa0000');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Flame trail (use normalized direction with fixed length)
  const dir = normalize({ x: p.vx, y: p.vy });
  if (dir.x !== 0 || dir.y !== 0) {
    ctx.beginPath();
    ctx.moveTo(-dir.x * 8, -dir.y * 8);
    ctx.lineTo(-dir.x * 16, -dir.y * 16);
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

/**
 * Flamethrower - fire particle
 */
function renderFlame(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  const alpha = Math.max(0.3, 1 - p.distanceTraveled / (p.maxDistance || 120));

  ctx.beginPath();
  ctx.arc(0, 0, p.radius * randomRange(1, 1.3), 0, TWO_PI);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
  gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha * 0.5})`);
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Enemy Bullet - bright solid circle with strong glow for visibility
 */
function renderEnemyBullet(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);
  ctx.fillStyle = p.color;
  ctx.fill();

  // Bright core for contrast
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 0.5, 0, TWO_PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
}

/**
 * Boss Bullet - hostile projectile with dark center for menacing look
 */
function renderBossBullet(ctx: CanvasRenderingContext2D, p: ProjectileRenderData): void {
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, TWO_PI);
  ctx.fillStyle = p.color;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 0.5, 0, TWO_PI);
  ctx.fillStyle = '#000';
  ctx.fill();
}
