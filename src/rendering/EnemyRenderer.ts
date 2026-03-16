import type { EnemyRenderData } from './render-types';
import { TWO_PI } from '@/utils/math';

/**
 * Renders an enemy to the canvas.
 */
export function renderEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyRenderData): void {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Ghost transparency
  if (enemy.phasing) {
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
  }

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
  ctx.fillStyle = enemy.color;
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // HP bar (only if damaged, and not for bosses with top health bar)
  if (enemy.hp < enemy.maxHp && !enemy.hasTopHealthBar) {
    drawHealthBar(ctx, enemy.radius, enemy.hp, enemy.maxHp);
  }

  drawEyes(ctx, enemy.radius);

  if (enemy.isBoss) {
    drawBossCrown(ctx, enemy.radius);
    if (enemy.bossName) {
      drawBossName(ctx, enemy.radius, enemy.bossName);
    }
  }

  // TODO: hmmm probably it does not work, or is not visible enough
  // Exploder warning glow
  if (enemy.explodeOnDeath) {
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
  }

  ctx.restore();
}

function drawEyes(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.2, 0, TWO_PI);
  ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.2, 0, TWO_PI);
  ctx.fill();

  // TODO: pupils should follow player?
  // Angry eyebrows (angled downward toward center)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.5, -radius * 0.5);
  ctx.lineTo(-radius * 0.1, -radius * 0.3);
  ctx.moveTo(radius * 0.5, -radius * 0.5);
  ctx.lineTo(radius * 0.1, -radius * 0.3);
  ctx.stroke();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  radius: number,
  hp: number,
  maxHp: number,
): void {
  const barWidth = radius * 2;
  const barHeight = 4;
  const hpPercent = hp / maxHp;
  ctx.fillStyle = '#333';
  ctx.fillRect(-barWidth / 2, -radius - 10, barWidth, barHeight);

  ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(-barWidth / 2, -radius - 10, barWidth * hpPercent, barHeight);
}

function drawBossCrown(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-20, -radius - 5);
  ctx.lineTo(-15, -radius - 20);
  ctx.lineTo(-5, -radius - 10);
  ctx.lineTo(0, -radius - 25);
  ctx.lineTo(5, -radius - 10);
  ctx.lineTo(15, -radius - 20);
  ctx.lineTo(20, -radius - 5);
  ctx.closePath();
  ctx.fill();
}

function drawBossName(ctx: CanvasRenderingContext2D, radius: number, name: string): void {
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(name, 0, -radius - 35);
  ctx.fillStyle = '#ffd700';
  ctx.fillText(name, 0, -radius - 35);
}
