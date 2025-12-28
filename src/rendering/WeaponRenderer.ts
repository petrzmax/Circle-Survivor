/**
 * Weapon Renderer - draws weapons around the player
 */

import { Player } from '@/entities/Player';
import { WeaponType } from '@/types';
import { TWO_PI } from '@/utils/math';

/**
 * Draw all weapons around the player
 */
export function renderWeapons(ctx: CanvasRenderingContext2D, player: Player): void {
  const weaponCount = player.weapons.length;
  if (weaponCount === 0) return;

  player.weapons.forEach((weapon, index) => {
    // Get weapon position with target aiming
    const pos = player.getWeaponPosition(index, player.currentTarget);

    // Draw weapon icon
    drawWeapon(ctx, weapon.type, weapon.level, pos.x, pos.y, pos.angle);
  });
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  type: WeaponType,
  level: number,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2); // Rotation in movement direction

  switch (type) {
    case WeaponType.PISTOL:
      drawPistol(ctx);
      break;

    case WeaponType.SMG:
      drawSMG(ctx);
      break;

    case WeaponType.SHOTGUN:
      drawShotgun(ctx);
      break;

    case WeaponType.SNIPER:
      drawSniper(ctx);
      break;

    case WeaponType.LASER:
      drawLaser(ctx);
      break;

    case WeaponType.MINIGUN:
      drawMinigun(ctx);
      break;

    case WeaponType.BAZOOKA:
      drawBazooka(ctx);
      break;

    case WeaponType.FLAMETHROWER:
      drawFlamethrower(ctx);
      break;

    case WeaponType.MINES:
      drawMine(ctx);
      break;

    case WeaponType.NUKE:
      // TODO: change name to nuclear launcher
      drawNuke(ctx);
      break;

    case WeaponType.SCYTHE:
      drawScythe(ctx);
      break;

    case WeaponType.SWORD:
      drawSword(ctx);
      break;

    case WeaponType.HOLY_GRENADE:
      drawHolyGrenade(ctx);
      break;

    case WeaponType.BANANA:
      drawBanana(ctx);
      break;

    case WeaponType.CROSSBOW:
      drawCrossbow(ctx);
      break;

    default:
      throw new Error(`[WeaponRenderer] Unknown weapon type: ${type as string}`);
  }

  // Weapon level (if > 1)
  if (level > 1) {
    drawWeaponLevel(ctx, level);
  }

  ctx.restore();
}

function drawWeaponLevel(ctx: CanvasRenderingContext2D, level: number): void {
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`+${level - 1}`, 0, 14);
}

function drawCrossbow(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-1, -10, 2, 16);
  ctx.fillRect(-8, -4, 16, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, -12, 2, 4);
}

function drawBanana(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI, false);
  ctx.fill();
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-1, -2, 2, 4);
}

function drawHolyGrenade(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 4);
  ctx.moveTo(-3, 0);
  ctx.lineTo(3, 0);
  ctx.stroke();
}

function drawSword(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(-2, -14, 4, 20);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-5, 4, 10, 4);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-2, 8, 4, 6);
}

function drawScythe(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#9932cc';
  ctx.strokeStyle = '#9932cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(0, -8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(5, -8, 8, Math.PI * 0.7, Math.PI * 1.5);
  ctx.stroke();
}

function drawNuke(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(6, 8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(0, 2, 4, 0, TWO_PI);
  ctx.fill();
}

function drawMine(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TWO_PI);
  ctx.fill();
}

function drawFlamethrower(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ff4400';
  ctx.fillRect(-4, -8, 8, 14);
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -12);
  ctx.lineTo(0, -18);
  ctx.fill();
}

function drawBazooka(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#888';
  ctx.fillRect(-5, -12, 10, 18);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-4, -14, 8, 4);
}

function drawMinigun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ff6600';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(i * 2 - 1, -10, 2, 14);
  }
  ctx.fillRect(-5, 2, 10, 6);
}

function drawLaser(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -3, 3, 0, TWO_PI);
  ctx.fill();
}

function drawSniper(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(-2, -14, 4, 20);
  ctx.fillRect(-4, 2, 8, 6);
}

function drawShotgun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(-4, -6, 8, 10);
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(6, -10);
  ctx.lineTo(4, -6);
  ctx.lineTo(-4, -6);
  ctx.fill();
}

function drawSMG(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffa500';
  ctx.fillRect(-3, -8, 6, 14);
  ctx.fillRect(-2, -12, 4, 4);
}

function drawPistol(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(-3, -6, 6, 10);
  ctx.fillRect(-2, -10, 4, 4);
}
