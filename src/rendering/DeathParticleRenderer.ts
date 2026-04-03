import type { DeathParticle } from '@/systems/EffectsSystem';
import { TWO_PI } from '@/utils/math';

/**
 * Render death particle effects (pure draw, no state mutation)
 */
export function renderDeathParticle(ctx: CanvasRenderingContext2D, p: DeathParticle): void {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;

  if (p.isBoss) {
    // Boss particles with glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * p.life, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}
