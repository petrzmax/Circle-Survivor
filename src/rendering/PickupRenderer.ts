import type { PickupRenderData } from './render-types';
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

  ctx.save();
  ctx.translate(size / 2, size / 2);

  if (type === PickupType.GOLD) {
    drawGold(ctx);
    // Currently only GOLD and HEALTH types exist, but may have more pickup types in future
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (type === PickupType.HEALTH) {
    drawHealth(ctx, radius);
  }

  ctx.restore();

  return { canvas, ctx };
}

/**
 * Get cached canvas for pickup type (lazy initialization)
 */
function getPickupCache(type: PickupType, radius: number): CachedCanvas {
  let cached = pickupCache.get(type);
  if (!cached) {
    cached = createPickupCache(type, radius);
    pickupCache.set(type, cached);
  }
  return cached;
}

/**
 * Renders a pickup to the canvas.
 */
export function renderPickup(ctx: CanvasRenderingContext2D, pickup: PickupRenderData): void {
  ctx.save();

  if (pickup.scale < 1) {
    ctx.globalAlpha = pickup.scale;
  }

  // Use cached pre-rendered canvas
  const cached = getPickupCache(pickup.type, pickup.radius);
  const halfSize = cached.canvas.width / 2;

  // Draw cached image scaled and centered
  ctx.drawImage(
    cached.canvas,
    pickup.x - halfSize * pickup.scale,
    pickup.y - halfSize * pickup.scale,
    cached.canvas.width * pickup.scale,
    cached.canvas.height * pickup.scale,
  );

  ctx.restore();
}

function drawGold(ctx: CanvasRenderingContext2D): void {
  // Subtle gold glow (only underneath)
  ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  // Money bag emoji
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💰', 0, 0);
}

/**
 * Health pickup - red heart
 */
function drawHealth(ctx: CanvasRenderingContext2D, radius: number): void {
  // Red heart with glow
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ff4444';

  // Draw a heart shape
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.3);
  ctx.bezierCurveTo(-radius, -radius, -radius, radius * 0.5, 0, radius);
  ctx.bezierCurveTo(radius, radius * 0.5, radius, -radius, 0, -radius * 0.3);
  ctx.fill();
}
