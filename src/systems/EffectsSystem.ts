/**
 * EffectsSystem - handles visual effects like explosions and particles.
 * Rendering and updating of temporary visual effects.
 */

import { EventBus } from '@/core';
import { Enemy } from '@/enemies';
import { renderExplosion } from '@/rendering';
import { EnemyType, VisualEffect } from '@/types';
import { distance, randomAngle, randomChance, randomRange } from '@/utils';
import { TWO_PI, Vector2 } from '@/utils/math';

// ============ Effect Interfaces ============

export interface Explosion {
  position: Vector2;
  radius: number;
  maxRadius: number;
  alpha: number;
  created: number;
  visualEffect: VisualEffect;
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

// ============ Effects System ============

export class EffectsSystem {
  // TODO analyse if these should be in entity manager
  private effects: EffectsState = this.createEffectsState();

  public constructor() {
    this.connectToEventBus();
  }

  private connectToEventBus(): void {
    EventBus.on('explosionTriggered', (data) => {
      this.createExplosion(data.position, data.radius, data.visualEffect);
    });

    EventBus.on('enemyDeath', (data) => {
      this.createDeathEffect(data.enemy);
    });
  }

  /**
   * Creates empty effects state
   */
  private createEffectsState(): EffectsState {
    return {
      explosions: [],
      deathEffects: [],
      shockwaves: [],
    };
  }

  /**
   * Update shockwaves (boss attack effect)
   * @returns True if player died from shockwave
   */
  public updateShockwaves(
    player: {
      x: number;
      y: number;
      dodge: number;
      takeDamage: (damage: number, time: number) => boolean;
    },
    currentTime: number,
    onDodge: () => void,
  ): boolean {
    for (let i = this.effects.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.effects.shockwaves[i]!;
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
        this.effects.shockwaves.splice(i, 1);
      }
    }
    return false;
  }

  // TODO move to rendering
  /**
   * Render explosions
   */
  private renderExplosions(ctx: CanvasRenderingContext2D): void {
    const explosions = this.effects.explosions;
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i]!;
      const age = Date.now() - exp.created;
      const duration = exp.visualEffect === VisualEffect.NUKE ? 600 : 300;
      exp.alpha = 1 - age / duration;

      if (exp.alpha <= 0) {
        explosions.splice(i, 1);
        continue;
      }

      renderExplosion(ctx, exp);
    }
  }

  /**
   * Render death particle effects
   */
  // TODO optimize - explosins bottleneck
  private renderDeathEffects(ctx: CanvasRenderingContext2D): void {
    const deathEffects = this.effects.deathEffects;
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
  }

  /**
   * Render shockwave effects
   */
  private renderShockwaves(ctx: CanvasRenderingContext2D): void {
    const shockwaves = this.effects.shockwaves;
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
  }

  /**
   * Create death particle effect for enemy
   */
  public createDeathEffect(enemy: Enemy): void {
    // Particle count depends on enemy type
    let particleCount = 8;
    let particleSize = 4;
    const particleColor = enemy.color;

    if (enemy.isBoss) {
      particleCount = 30;
      particleSize = 8;
    } else if (enemy.type === EnemyType.TANK || enemy.type === EnemyType.BRUTE) {
      particleCount = 15;
      particleSize = 6;
    } else if (enemy.type === EnemyType.SWARM) {
      particleCount = 5;
      particleSize = 3;
    }

    // Creating particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (TWO_PI / particleCount) * i + randomRange(0, 0.5);
      const speed = randomRange(2, 6);

      this.effects.deathEffects.push({
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

        this.effects.deathEffects.push({
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
  }

  /**
   * Create explosion visual effect
   */
  private createExplosion(position: Vector2, radius: number, visualEffect: VisualEffect): void {
    this.effects.explosions.push({
      position,
      radius,
      maxRadius: radius,
      alpha: 1,
      created: Date.now(),
      visualEffect,
    });
  }

  /**
   * Create shockwave effect (boss attack)
   */
  public createShockwave(shockwave: {
    x: number;
    y: number;
    radius: number;
    damage: number;
    color?: string;
  }): void {
    this.effects.shockwaves.push({
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
  }

  /**
   * Render all effects
   */
  public renderAll(ctx: CanvasRenderingContext2D): void {
    // TODO move to rendering
    this.renderExplosions(ctx);
    this.renderDeathEffects(ctx);
    this.renderShockwaves(ctx);
  }
}
