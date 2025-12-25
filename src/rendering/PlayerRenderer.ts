/**
 * PlayerRenderer - Renders the player entity.
 * Matches original js/player.js render() exactly.
 */

import { Player } from '@/entities/Player';
import { TWO_PI } from '@/utils/math';

/**
 * Renders the player to the canvas.
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  currentTime: number,
): void {
  // Flash when invincible
  if (currentTime < player.invincibleUntil) {
    if (Math.floor(currentTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
  }

  // Body (rectangle)
  ctx.fillStyle = player.color;
  ctx.fillRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height,
  );

  // Armor visual (blue border if has armor)
  if (player.armor > 0) {
    ctx.strokeStyle = `rgba(100, 150, 255, ${Math.min(player.armor / 50, 1)})`;
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = '#2a7fff';
    ctx.lineWidth = 2;
  }
  ctx.strokeRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height,
  );

  // Eyes (direction indicator)
  ctx.fillStyle = 'white';
  const eyeOffset = 5;
  ctx.beginPath();
  ctx.arc(player.x - eyeOffset, player.y - 3, 4, 0, TWO_PI);
  ctx.arc(player.x + eyeOffset, player.y - 3, 4, 0, TWO_PI);
  ctx.fill();

  ctx.globalAlpha = 1;
}

/**
 * Renders player health bar (HUD element, positioned relative to canvas not player)
 */
export function renderPlayerHealthBar(
  ctx: CanvasRenderingContext2D,
  player: Player,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x, y, width, height);

  // Health fill
  const healthPercent = player.hp / player.maxHp;
  const healthColor =
    healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
  ctx.fillStyle = healthColor;
  ctx.fillRect(x, y, width * healthPercent, height);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Health text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, x + width / 2, y + height / 2);

  ctx.restore();
}
