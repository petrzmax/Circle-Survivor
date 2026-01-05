import { Explosion } from '@/systems/EffectsSystem';
import { VisualEffect } from '@/types';
import { TWO_PI } from '@/utils/math';

export function renderExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion): void {
  ctx.save();
  ctx.translate(explosion.position.x, explosion.position.y);
  ctx.globalAlpha = explosion.alpha;
  ctx.beginPath();
  ctx.arc(0, 0, explosion.radius * (1 - explosion.alpha * 0.3), 0, TWO_PI);

  switch (explosion.visualEffect) {
    case VisualEffect.NUKE:
      drawNukeExplosion(ctx, explosion);
      break;
    case VisualEffect.HOLY:
      drawHolyExplosion(ctx, explosion);
      break;
    case VisualEffect.BANANA:
      drawBananaExplosion(ctx, explosion);
      break;
    default:
      drawExplosion(ctx);
  }

  ctx.restore();
}
// Normal explosion
function drawExplosion(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffff00';
  ctx.fill();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Banana bomb - yellow explosion
function drawBananaExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion): void {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, explosion.radius);
  gradient.addColorStop(0, '#ffff00');
  gradient.addColorStop(0.4, '#ffcc00');
  gradient.addColorStop(0.7, '#ff6600');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

// Holy Grenade - golden holy explosion
function drawHolyExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion): void {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, explosion.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, '#ffdd00');
  gradient.addColorStop(0.6, '#ffaa00');
  gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
  // Luminous cross
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -explosion.radius * 0.5);
  ctx.lineTo(0, explosion.radius * 0.5);
  ctx.moveTo(-explosion.radius * 0.4, 0);
  ctx.lineTo(explosion.radius * 0.4, 0);
  ctx.stroke();
}

// Nuke - green explosion with multiple rings
function drawNukeExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion): void {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, explosion.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, '#00ff00');
  gradient.addColorStop(0.6, '#008800');
  gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
  // Second ring
  ctx.beginPath();
  ctx.arc(0, 0, explosion.radius * 0.6 * (1 - explosion.alpha * 0.5), 0, TWO_PI);
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 5;
  ctx.stroke();
}
