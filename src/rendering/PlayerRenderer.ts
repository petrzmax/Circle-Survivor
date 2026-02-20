import { Player } from '@/domain/player/Player';
import { TWO_PI } from '@/utils/math';

/**
 * Renders the player to the canvas.
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  currentTime: number,
): void {
  ctx.save();
  ctx.translate(player.position.x, player.position.y);

  // Flash when invincible
  if (currentTime < player.invincibleUntil) {
    if (Math.floor(currentTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
  }

  // Body (rectangle)
  ctx.fillStyle = player.color;
  ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

  // Armor visual (blue border if has armor)
  if (player.armor > 0) {
    ctx.strokeStyle = `rgba(100, 150, 255, ${Math.min(player.armor / 50, 1)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
  }

  // TODO experiment - look on  nearest enemy
  // Eyes
  ctx.fillStyle = 'white';
  const eyeOffset = 5;
  ctx.beginPath();
  ctx.arc(-eyeOffset, -3, 4, 0, TWO_PI);
  ctx.arc(eyeOffset, -3, 4, 0, TWO_PI);
  ctx.fill();

  ctx.globalAlpha = 1; // TODO needed?
  ctx.restore();
}
