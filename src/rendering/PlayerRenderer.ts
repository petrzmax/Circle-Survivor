import type { PlayerRenderData } from './render-types';
import { TWO_PI } from '@/utils/math';

/**
 * Renders the player to the canvas.
 */
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerRenderData,
  currentTime: number,
): void {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Flash when invincible
  if (currentTime < p.invincibleUntil) {
    if (Math.floor(currentTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
  }

  // Body (rectangle)
  ctx.fillStyle = p.color;
  ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

  // Armor visual (blue border if has armor)
  if (p.armor > 0) {
    ctx.strokeStyle = `rgba(100, 150, 255, ${Math.min(p.armor / 50, 1)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);
  }

  // TODO experiment - look on  nearest enemy
  // Eyes
  ctx.fillStyle = 'white';
  const eyeOffset = 5;
  ctx.beginPath();
  ctx.arc(-eyeOffset, -3, 4, 0, TWO_PI);
  ctx.arc(eyeOffset, -3, 4, 0, TWO_PI);
  ctx.fill();

  ctx.restore();
}
