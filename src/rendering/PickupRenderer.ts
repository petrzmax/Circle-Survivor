import { Pickup } from '@/entities/Pickup';
import { PickupType } from '@/types/enums';

// ============ Off-screen Canvas Cache for Performance ============
// Pre-render pickups once, then stamp copies with drawImage() (10x faster than fillText)
// TODO refactor to a general caching system. it's renderer, cache logic should not be here
// TODO refactor the code, it's ugly!

interface CachedCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

const pickupCache = new Map<PickupType, CachedCanvas>();

/**
 * Pre-render a pickup type to an off-screen canvas using original draw functions
 */
function createPickupCache(type: PickupType, radius: number): CachedCanvas {
  const size = 48; // Large enough for emoji + glow
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Create a temporary pickup-like object for drawing
  const tempPickup = {
    position: { x: size / 2, y: size / 2 },
    radius: radius,
    getScale: () => 1,
  } as Pickup;

  // Use original draw functions to render to cache
  ctx.save();
  ctx.translate(tempPickup.position.x, tempPickup.position.y);

  if (type === PickupType.GOLD) {
    drawGold(ctx, tempPickup);
    // Currently only GOLD and HEALTH types exist, but may have more pickup types in future
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (type === PickupType.HEALTH) {
    drawHealth(ctx, tempPickup);
  }

  ctx.restore();

  return { canvas, ctx };
}

/**
 * Get cached canvas for pickup type (lazy initialization)
 */
function getPickupCache(pickup: Pickup): CachedCanvas {
  let cached = pickupCache.get(pickup.type);
  if (!cached) {
    cached = createPickupCache(pickup.type, pickup.radius);
    pickupCache.set(pickup.type, cached);
  }
  return cached;
}

/**
 * Renders a pickup to the canvas.
 */
export function renderPickup(ctx: CanvasRenderingContext2D, pickup: Pickup): void {
  ctx.save();

  const scale = pickup.getScale();
  if (scale < 1) {
    ctx.globalAlpha = scale;
  }

  // Use cached pre-rendered canvas
  const cached = getPickupCache(pickup);
  const halfSize = cached.canvas.width / 2;

  // Draw cached image scaled and centered
  ctx.drawImage(
    cached.canvas,
    pickup.position.x - halfSize * scale,
    pickup.position.y - halfSize * scale,
    cached.canvas.width * scale,
    cached.canvas.height * scale,
  );

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
