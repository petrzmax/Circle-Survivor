/**
 * EnemyRenderer - Renders enemy entities.
 * Matches original js/enemy.js render() exactly.
 */

import { Enemy } from '@/entities/Enemy';
import { TWO_PI } from '@/utils/math';

/**
 * Renders an enemy to the canvas.
 */
export function renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  ctx.save();

  // Ghost transparency
  if (enemy.phasing) {
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
  }

  // Body
  ctx.beginPath();
  ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, TWO_PI);
  ctx.fillStyle = enemy.color;
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // HP bar (only if damaged, and not for bosses with top health bar)
  if (enemy.hp < enemy.maxHp && !enemy.hasTopHealthBar) {
    const barWidth = enemy.radius * 2;
    const barHeight = 4;
    const hpPercent = enemy.hp / enemy.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(
      enemy.position.x - barWidth / 2,
      enemy.position.y - enemy.radius - 10,
      barWidth,
      barHeight,
    );

    ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(
      enemy.position.x - barWidth / 2,
      enemy.position.y - enemy.radius - 10,
      barWidth * hpPercent,
      barHeight,
    );
  }

  // Eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(
    enemy.position.x - enemy.radius * 0.3,
    enemy.position.y - enemy.radius * 0.2,
    enemy.radius * 0.2,
    0,
    TWO_PI,
  );
  ctx.arc(
    enemy.position.x + enemy.radius * 0.3,
    enemy.position.y - enemy.radius * 0.2,
    enemy.radius * 0.2,
    0,
    TWO_PI,
  );
  ctx.fill();

  // Angry eyebrows
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(enemy.position.x - enemy.radius * 0.5, enemy.position.y - enemy.radius * 0.4);
  ctx.lineTo(enemy.position.x - enemy.radius * 0.1, enemy.position.y - enemy.radius * 0.5);
  ctx.moveTo(enemy.position.x + enemy.radius * 0.5, enemy.position.y - enemy.radius * 0.4);
  ctx.lineTo(enemy.position.x + enemy.radius * 0.1, enemy.position.y - enemy.radius * 0.5);
  ctx.stroke();

  // Boss crown
  if (enemy.isBoss) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(enemy.position.x - 20, enemy.position.y - enemy.radius - 5);
    ctx.lineTo(enemy.position.x - 15, enemy.position.y - enemy.radius - 20);
    ctx.lineTo(enemy.position.x - 5, enemy.position.y - enemy.radius - 10);
    ctx.lineTo(enemy.position.x, enemy.position.y - enemy.radius - 25);
    ctx.lineTo(enemy.position.x + 5, enemy.position.y - enemy.radius - 10);
    ctx.lineTo(enemy.position.x + 15, enemy.position.y - enemy.radius - 20);
    ctx.lineTo(enemy.position.x + 20, enemy.position.y - enemy.radius - 5);
    ctx.closePath();
    ctx.fill();

    // Boss name
    if (enemy.bossName) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(enemy.bossName, enemy.position.x, enemy.position.y - enemy.radius - 35);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(enemy.bossName, enemy.position.x, enemy.position.y - enemy.radius - 35);
    }
  }

  // Exploder warning glow
  if (enemy.explodeOnDeath) {
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
  }

  ctx.restore();
}
