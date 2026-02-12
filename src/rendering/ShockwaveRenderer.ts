import { Shockwave } from '@/systems/EffectsSystem';
import { TWO_PI } from '@/utils/math';

const OUTER_LINE_WIDTH = 8;
const INNER_LINE_WIDTH = 4;
const INNER_RING_RATIO = 0.7;
const SHADOW_BLUR = 20;
const ALPHA_MULTIPLIER = 0.6;
const DEFAULT_COLOR = '#ff4444';

export function renderShockwave(ctx: CanvasRenderingContext2D, sw: Shockwave): void {
  const color = sw.color || DEFAULT_COLOR;

  ctx.save();
  ctx.globalAlpha = sw.alpha * ALPHA_MULTIPLIER;

  // Outer ring (expanding)
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, sw.currentRadius, 0, TWO_PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = OUTER_LINE_WIDTH;
  ctx.shadowColor = color;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, sw.currentRadius * INNER_RING_RATIO, 0, TWO_PI);
  ctx.lineWidth = INNER_LINE_WIDTH;
  ctx.stroke();

  ctx.restore();
}
