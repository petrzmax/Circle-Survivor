/**
 * ProjectileRenderer - Renders projectiles based on their type.
 * Separates rendering logic from entity logic.
 */

import { Projectile } from '@/entities/Projectile';
import { ProjectileType } from '@/types/enums';

/**
 * Renders a projectile to the canvas based on its type.
 */
export function renderProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile): void {
  ctx.save();

  switch (projectile.type) {
    case ProjectileType.NUKE:
      renderNuke(ctx, projectile);
      break;
    case ProjectileType.SCYTHE:
      renderScythe(ctx, projectile);
      break;
    case ProjectileType.SWORD:
      renderSword(ctx, projectile);
      break;
    case ProjectileType.HOLY_GRENADE:
      renderHolyGrenade(ctx, projectile);
      break;
    case ProjectileType.BANANA:
    case ProjectileType.MINI_BANANA:
      renderBanana(ctx, projectile);
      break;
    case ProjectileType.CROSSBOW_BOLT:
      renderCrossbowBolt(ctx, projectile);
      break;
    case ProjectileType.ROCKET:
      renderRocket(ctx, projectile);
      break;
    case ProjectileType.FLAMETHROWER:
      renderFlame(ctx, projectile);
      break;
    case ProjectileType.ENEMY_BULLET:
      renderEnemyBullet(ctx, projectile);
      break;
    default:
      renderStandardBullet(ctx, projectile);
  }

  ctx.restore();
}

/**
 * Standard bullet - simple colored circle with glow
 */
function renderStandardBullet(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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
function renderNuke(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
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
 * Scythe - rotating crescent (uses Date.now for rotation)
 */
function renderScythe(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.translate(p.x, p.y);
  // TODO Does it rotate? Was it rotating in original code?
  ctx.rotate(Date.now() / 100);

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 1.5);
  ctx.lineTo(0, 0);
  ctx.fillStyle = '#9932cc';
  ctx.fill();

  ctx.strokeStyle = '#660099';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.shadowColor = '#9932cc';
  ctx.shadowBlur = 15;
}

/**
 * Sword - swift slash shape
 */
function renderSword(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const vel = p.getVelocity();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(vel.vy, vel.vx));

  ctx.beginPath();
  ctx.moveTo(-p.radius, 0);
  ctx.lineTo(p.radius, -3);
  ctx.lineTo(p.radius + 5, 0);
  ctx.lineTo(p.radius, 3);
  ctx.closePath();

  ctx.fillStyle = '#c0c0c0';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Holy Grenade - golden ball with cross
 */
function renderHolyGrenade(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(1, '#b8860b');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Cross
  ctx.strokeStyle = '#8b0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 5);
  ctx.lineTo(p.x, p.y + 5);
  ctx.moveTo(p.x - 4, p.y - 1);
  ctx.lineTo(p.x + 4, p.y - 1);
  ctx.stroke();

  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 15;
}

/**
 * Banana - rotating yellow crescent (uses Date.now for rotation)
 */
function renderBanana(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.translate(p.x, p.y);
  ctx.rotate(Date.now() / 150);

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
function renderCrossbowBolt(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const vel = p.getVelocity();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(vel.vy, vel.vx));

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
  ctx.arc(p.radius, 0, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Rocket - bazooka rocket with flame trail
 */
function renderRocket(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const vel = p.getVelocity();

  // Body with gradient
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
  gradient.addColorStop(0, '#ffff00');
  gradient.addColorStop(0.7, '#ff4400');
  gradient.addColorStop(1, '#aa0000');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Flame trail
  ctx.beginPath();
  ctx.moveTo(p.x - vel.vx * 2, p.y - vel.vy * 2);
  ctx.lineTo(p.x - vel.vx * 4, p.y - vel.vy * 4);
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 4;
  ctx.stroke();
}

/**
 * Flamethrower - fire particle
 */
function renderFlame(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const alpha = Math.max(0.3, 1 - p.distanceTraveled / (p.maxDistance || 120));

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * (1 + Math.random() * 0.3), 0, Math.PI * 2);

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
  gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha * 0.5})`);
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Enemy Bullet - red hostile projectile with dark center
 */
function renderEnemyBullet(ctx: CanvasRenderingContext2D, p: Projectile): void {
  // Glow effect
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10;

  // Main bullet
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();

  // Darker center
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}
