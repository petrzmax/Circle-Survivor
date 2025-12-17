/**
 * DeployableRenderer - Renders deployable objects (mines, turrets).
 */

import { Deployable } from '@/entities/Deployable';
import { DeployableType } from '@/types/enums';

/**
 * Renders a deployable to the canvas based on its type.
 */
export function renderDeployable(ctx: CanvasRenderingContext2D, deployable: Deployable): void {
  ctx.save();

  switch (deployable.type) {
    case DeployableType.MINE:
      renderMine(ctx, deployable);
      break;
    case DeployableType.TURRET:
      renderTurret(ctx, deployable);
      break;
    case DeployableType.TRAP:
      renderTrap(ctx, deployable);
      break;
    default:
      renderMine(ctx, deployable);
  }

  ctx.restore();
}

/**
 * Mine - dark circle with blinking red light when armed
 */
function renderMine(ctx: CanvasRenderingContext2D, d: Deployable): void {
  // Body
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();

  // Border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Blinking light only when armed
  if (d.isArmed) {
    ctx.beginPath();
    ctx.arc(d.x, d.y - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = Math.floor(Date.now() / 200) % 2 ? '#ff0000' : '#440000';
    ctx.fill();
  }
}

/**
 * Turret - placeholder for future implementation
 */
function renderTurret(ctx: CanvasRenderingContext2D, d: Deployable): void {
  // Base
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#555555';
  ctx.fill();

  // Gun barrel
  ctx.beginPath();
  ctx.rect(d.x, d.y - 3, d.radius + 5, 6);
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
function renderTrap(ctx: CanvasRenderingContext2D, d: Deployable): void {
  // Spiky circle
  ctx.beginPath();
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? d.radius : d.radius * 0.6;
    const x = d.x + Math.cos(angle) * r;
    const y = d.y + Math.sin(angle) * r;
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
