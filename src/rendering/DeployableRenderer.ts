import { Deployable } from '@/entities/Deployable';
import { DeployableType } from '@/types/enums';
import { TWO_PI } from '@/utils/math';

/**
 * Renders a deployable to the canvas based on its type.
 */
export function renderDeployable(
  ctx: CanvasRenderingContext2D,
  deployable: Deployable,
  currentTime: number,
): void {
  ctx.save();
  ctx.translate(deployable.position.x, deployable.position.y);

  switch (deployable.type) {
    case DeployableType.MINE:
      drawMine(ctx, deployable, currentTime);
      break;
    case DeployableType.TURRET:
      drawTurret(ctx, deployable);
      break;
    case DeployableType.TRAP:
      drawTrap(ctx, deployable);
      break;
    default:
      throw new Error(`Unknown deployable type: ${deployable.type as string}`);
  }

  ctx.restore();
}

/**
 * Mine - dark circle with blinking red light when armed
 */
function drawMine(ctx: CanvasRenderingContext2D, d: Deployable, currentTime: number): void {
  // Body
  ctx.beginPath();
  ctx.arc(0, 0, d.radius, 0, TWO_PI);
  ctx.fillStyle = '#333';
  ctx.fill();

  // Border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Blinking light only when armed (staggered with blinkOffset)
  if (d.isArmed) {
    ctx.beginPath();
    ctx.arc(0, -3, 3, 0, TWO_PI);
    // Use currentTime + blinkOffset for staggered blinking
    ctx.fillStyle = Math.floor((currentTime + d.blinkOffset) / 200) % 2 ? '#ff0000' : '#440000';
    ctx.fill();
  }
}

/**
 * Turret - placeholder for future implementation
 */
function drawTurret(ctx: CanvasRenderingContext2D, d: Deployable): void {
  // Base
  ctx.beginPath();
  ctx.arc(0, 0, d.radius, 0, TWO_PI);
  ctx.fillStyle = '#555555';
  ctx.fill();

  // Gun barrel
  ctx.beginPath();
  ctx.rect(0, -3, d.radius + 5, 6);
  ctx.fillStyle = '#333333';
  ctx.fill();

  // Border
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Trap - placeholder for future implementation
 */
function drawTrap(ctx: CanvasRenderingContext2D, d: Deployable): void {
  // Spiky circle
  ctx.beginPath();
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? d.radius : d.radius * 0.6;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = '#8b4513';
  ctx.fill();
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 2;
  ctx.stroke();
}
