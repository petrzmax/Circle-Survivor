import { Pickup } from '@/entities/Pickup';
import { PickupType } from '@/types/enums';

/**
 * Renders a pickup to the canvas.
 */
export function renderPickup(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  ctx.save();
  ctx.translate(pickup.position.x, pickup.position.y);

  switch (pickup.type) {
    case PickupType.GOLD:
      drawGold(ctx, pickup);
      break;
    case PickupType.HEALTH:
      drawHealth(ctx, pickup);
      break;
    default:
      throw new Error(`Unknown pickup type: ${pickup.type as string}`);
  }

  ctx.restore();
}

function drawGold(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  // shrinking animation
  const scale = pickup.getScale();
  if (scale < 1) {
    ctx.globalAlpha = scale;
  }

  // Subtle gold glow (only underneath)
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 2;

  // Money bag emoji - with shrinking animation
  ctx.font = `${16 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💰', 0, 0);
}

/**
 * Health pickup - red heart
 */
function drawHealth(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  const scale = pickup.getScale();
  if (scale < 1) {
    ctx.globalAlpha = scale;
  }

  // Red heart with glow
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
  ctx.shadowBlur = 10 * scale; //TODO there was no * by scale, check if it's needed
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ff4444';

  // Draw a heart shape
  ctx.scale(scale, scale);
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
