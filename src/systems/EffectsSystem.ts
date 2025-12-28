/**
 * EffectsSystem - handles visual effects like explosions and particles.
 * Rendering and updating of temporary visual effects.
 */

import { distance, randomAngle, randomChance, randomRange } from '@/utils';
import { TWO_PI, Vector2 } from '@/utils/math';

// ============ Effect Interfaces ============

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  created: number;
  // TODO refactor to enum or type
  isNuke: boolean;
  isHolyGrenade: boolean;
  isBanana: boolean;
}

export interface DeathParticle {
  // TODO add velocity component and transform component
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  decay: number;
  isBoss: boolean;
}

export interface Shockwave {
  x: number;
  y: number;
  maxRadius: number;
  currentRadius: number;
  damage: number;
  color: string;
  created: number;
  damageDealt: boolean;
  alpha: number;
}

// ============ Effects Storage ============

export interface EffectsState {
  explosions: Explosion[];
  deathEffects: DeathParticle[];
  shockwaves: Shockwave[];
}

/**
 * Creates empty effects state
 */
export function createEffectsState(): EffectsState {
  return {
    explosions: [],
    deathEffects: [],
    shockwaves: [],
  };
}

// ============ Effects System ============

export const EffectsSystem = {
  /**
   * Update shockwaves (boss attack effect)
   * @returns True if player died from shockwave
   */
  updateShockwaves(
    effects: EffectsState,
    player: {
      x: number;
      y: number;
      dodge: number;
      takeDamage: (damage: number, time: number) => boolean;
    },
    currentTime: number,
    onDodge: () => void,
  ): boolean {
    for (let i = effects.shockwaves.length - 1; i >= 0; i--) {
      const sw = effects.shockwaves[i]!;
      const age = Date.now() - sw.created;
      const duration = 400; // ms

      // Expand ring
      sw.currentRadius = sw.maxRadius * Math.min(1, age / (duration * 0.7));
      sw.alpha = 1 - age / duration;

      // Deal damage to player when wave reaches them (only once)
      if (!sw.damageDealt) {
        const distToPlayer = distance({ x: sw.x, y: sw.y }, player);
        if (distToPlayer <= sw.currentRadius && distToPlayer >= sw.currentRadius - 30) {
          // Player in wave range
          if (randomChance(player.dodge)) {
            onDodge();
          } else {
            const isDead = player.takeDamage(sw.damage, currentTime);
            if (isDead) return true;
          }
          sw.damageDealt = true;
        }
      }

      // Remove finished ones
      if (sw.alpha <= 0) {
        effects.shockwaves.splice(i, 1);
      }
    }
    return false;
  },

  /**
   * Render explosions
   */
  renderExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]): void {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i]!;
      const age = Date.now() - exp.created;
      const duration = exp.isNuke ? 600 : 300;
      exp.alpha = 1 - age / duration;

      if (exp.alpha <= 0) {
        explosions.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = exp.alpha;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius * (1 - exp.alpha * 0.3), 0, TWO_PI);

      if (exp.isNuke) {
        // Nuke - green explosion with multiple rings
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#00ff00');
        gradient.addColorStop(0.6, '#008800');
        gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        // Second ring
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * 0.6 * (1 - exp.alpha * 0.5), 0, TWO_PI);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (exp.isHolyGrenade) {
        // Holy Grenade - golden holy explosion
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
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
        ctx.moveTo(exp.x, exp.y - exp.radius * 0.5);
        ctx.lineTo(exp.x, exp.y + exp.radius * 0.5);
        ctx.moveTo(exp.x - exp.radius * 0.4, exp.y);
        ctx.lineTo(exp.x + exp.radius * 0.4, exp.y);
        ctx.stroke();
      } else if (exp.isBanana) {
        // Banana bomb - yellow explosion
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.4, '#ffcc00');
        gradient.addColorStop(0.7, '#ff6600');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      } else {
        // Normal explosion
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  /**
   * Render death particle effects
   */
  renderDeathEffects(ctx: CanvasRenderingContext2D, deathEffects: DeathParticle[]): void {
    for (let i = deathEffects.length - 1; i >= 0; i--) {
      const p = deathEffects[i]!;

      // Update position and life
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // Friction
      p.vy *= 0.95;
      p.life -= p.decay;
      p.alpha = p.life;

      if (p.life <= 0) {
        deathEffects.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.isBoss) {
        // Boss particles with glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
  },

  /**
   * Render shockwave effects
   */
  renderShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[]): void {
    for (const sw of shockwaves) {
      if (sw.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = sw.alpha * 0.6;

      // Outer ring (expanding)
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.currentRadius, 0, TWO_PI);
      ctx.strokeStyle = sw.color || '#ff4444';
      ctx.lineWidth = 8;
      ctx.shadowColor = sw.color || '#ff4444';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.currentRadius * 0.7, 0, TWO_PI);
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();
    }
  },

  /**
   * Create death particle effect for enemy
   */
  createDeathEffect(
    effects: EffectsState,
    enemy: { position: Vector2; color: string; isBoss: boolean; type: string },
  ): void {
    // Particle count depends on enemy type
    let particleCount = 8;
    let particleSize = 4;
    const particleColor = enemy.color;

    if (enemy.isBoss) {
      particleCount = 30;
      particleSize = 8;
    } else if (enemy.type === 'tank' || enemy.type === 'brute') {
      particleCount = 15;
      particleSize = 6;
    } else if (enemy.type === 'swarm') {
      particleCount = 5;
      particleSize = 3;
    }

    // Creating particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (TWO_PI / particleCount) * i + randomRange(0, 0.5);
      const speed = randomRange(2, 6);

      effects.deathEffects.push({
        x: enemy.position.x,
        y: enemy.position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: particleSize * randomRange(0.5, 1),
        color: particleColor,
        alpha: 1,
        life: 1,
        decay: randomRange(0.02, 0.04),
        isBoss: enemy.isBoss,
      });
    }

    // Additional effect for boss - second wave of larger particles
    if (enemy.isBoss) {
      for (let i = 0; i < 20; i++) {
        const angle = randomAngle();
        const speed = randomRange(1, 3);

        effects.deathEffects.push({
          x: enemy.position.x,
          y: enemy.position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: randomRange(10, 20),
          color: '#FFD700', // Golden color
          alpha: 1,
          life: 1,
          decay: 0.01,
          isBoss: true,
        });
      }
    }
  },

  /**
   * Create explosion visual effect
   */
  createExplosion(
    effects: EffectsState,
    position: Vector2,
    radius: number,
    isNuke: boolean = false,
    isHolyGrenade: boolean = false,
    isBanana: boolean = false,
  ): void {
    effects.explosions.push({
      x: position.x,
      y: position.y,
      radius,
      maxRadius: radius,
      alpha: 1,
      created: Date.now(),
      isNuke,
      isHolyGrenade,
      isBanana,
    });
  },

  /**
   * Create shockwave effect (boss attack)
   */
  createShockwave(
    effects: EffectsState,
    shockwave: { x: number; y: number; radius: number; damage: number; color?: string },
  ): void {
    effects.shockwaves.push({
      x: shockwave.x,
      y: shockwave.y,
      maxRadius: shockwave.radius,
      currentRadius: 0,
      damage: shockwave.damage,
      color: shockwave.color ?? '#ff4444',
      created: Date.now(),
      damageDealt: false,
      alpha: 1,
    });
  },

  /**
   * Render all effects
   */
  renderAll(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
    // TODO move to rendering
    this.renderExplosions(ctx, effects.explosions);
    this.renderDeathEffects(ctx, effects.deathEffects);
    this.renderShockwaves(ctx, effects.shockwaves);
  },
};
