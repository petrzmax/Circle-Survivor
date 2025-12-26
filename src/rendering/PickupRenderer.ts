/**
 * PickupRenderer - Renders pickup entities.
 */

import { Pickup } from '@/entities/Pickup';
import { PickupType } from '@/types/enums';

/**
 * Renders a pickup to the canvas.
 */
export function renderPickup(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  ctx.save();

  // Apply scale (shrinking animation)
  const scale = pickup.getScale();
  if (scale < 1) {
    ctx.globalAlpha = scale; // Also add fade transparency
  }

  switch (pickup.type) {
    case PickupType.GOLD:
      renderGold(ctx, pickup, scale);
      break;
    case PickupType.HEALTH:
      renderHealth(ctx, pickup);
      break;
    default:
      renderGold(ctx, pickup, scale);
  }

  ctx.restore();
}

/**
 * Gold pickup - money bag emoji
 */
function renderGold(ctx: CanvasRenderingContext2D, pickup: Pickup, scale: number): void {
  // Subtle gold glow (only underneath)
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 2;

  // Money bag emoji - z animacją kurczenia
  ctx.font = `${16 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💰', pickup.position.x, pickup.position.y);
}

/**
 * Health pickup - red heart
 */
function renderHealth(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  // Apply scale for health too
  const healthScale = pickup.getScale();
  if (healthScale < 1) {
    ctx.globalAlpha = healthScale;
  }

  // Red heart with glow
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
  ctx.shadowBlur = 10 * healthScale;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ff4444';

  // Draw a heart shape
  ctx.translate(pickup.position.x, pickup.position.y);
  ctx.scale(healthScale, healthScale);
  ctx.beginPath();
  ctx.moveTo(0, -pickup.radius * 0.3);
  ctx.bezierCurveTo(
    -pickup.radius,
    -pickup.radius,
    -pickup.radius,
    pickup.radius * 0.5,
    0,
    pickup.radius,
  );
  ctx.bezierCurveTo(
    pickup.radius,
    pickup.radius * 0.5,
    pickup.radius,
    -pickup.radius,
    0,
    -pickup.radius * 0.3,
  );
  ctx.fill();
}
