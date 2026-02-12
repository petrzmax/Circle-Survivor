/**
 * EffectsSystem - handles visual effects like explosions and particles.
 * Rendering and updating of temporary visual effects.
 */

import { ConfigService } from '@/config/ConfigService';
import { EffectsConfig } from '@/config/effects.config';
import { Enemy } from '@/domain/enemies';
import { EventBus } from '@/events/EventBus';
import { renderExplosion } from '@/rendering';
import { renderShockwave } from '@/rendering/ShockwaveRenderer';
import { VisualEffect } from '@/types';
import { ObjectPool, randomAngle, randomRange } from '@/utils';
import { TWO_PI, Vector2 } from '@/utils/math';
import { singleton } from 'tsyringe';

// ============ Effect Interfaces ============

export interface Explosion {
  active: boolean;
  position: Vector2;
  radius: number;
  maxRadius: number;
  alpha: number;
  created: number;
  visualEffect: VisualEffect;
}

export interface DeathParticle {
  active: boolean;
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

// ============ Effects System ============

@singleton()
export class EffectsSystem {
  private readonly config: EffectsConfig;
  private explosionPool: ObjectPool<Explosion>;
  private deathParticlePool: ObjectPool<DeathParticle>;
  private shockwaves: Shockwave[] = [];
  /** Current game time, updated each frame via update() */
  private currentTime: number = 0;

  public constructor(configService: ConfigService) {
    this.config = configService.getEffectsConfig();
    const poolConfig = this.config.pool;

    this.explosionPool = new ObjectPool<Explosion>(
      () => ({
        active: false,
        position: { x: 0, y: 0 },
        radius: 0,
        maxRadius: 0,
        alpha: 0,
        created: 0,
        visualEffect: VisualEffect.STANDARD,
      }),
      (e) => {
        e.alpha = 0;
        e.radius = 0;
        e.maxRadius = 0;
        e.created = 0;
      },
      poolConfig.initialExplosions,
    );

    this.deathParticlePool = new ObjectPool<DeathParticle>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        color: '',
        alpha: 0,
        life: 0,
        decay: 0,
        isBoss: false,
      }),
      (p) => {
        p.x = 0;
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.size = 0;
        p.alpha = 0;
        p.life = 0;
        p.decay = 0;
        p.isBoss = false;
      },
      poolConfig.initialDeathParticles,
    );

    this.connectToEventBus();
  }

  private connectToEventBus(): void {
    EventBus.on('explosionTriggered', (data) => {
      this.createExplosion(data.position, data.radius, data.visualEffect);
    });

    EventBus.on('enemyDeath', (data) => {
      this.createDeathEffect(data.enemy);
    });

    EventBus.on('shockwaveTriggered', (data) => {
      this.createShockwave(data);
    });
  }

  /**
   * Reset all active effects (on game restart)
   */
  public reset(): void {
    this.explosionPool.releaseAll();
    this.deathParticlePool.releaseAll();
    this.shockwaves = [];
  }

  /**
   * Get active shockwaves for collision detection
   */
  public getActiveShockwaves(): Shockwave[] {
    return this.shockwaves;
  }

  /**
   * Update shockwave visuals (radius expansion, alpha fade, removal)
   */
  public updateShockwaves(currentTime: number): void {
    const { duration, expansionFactor } = this.config.shockwaves;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]!;
      const age = currentTime - sw.created;

      // Expand ring
      sw.currentRadius = sw.maxRadius * Math.min(1, age / (duration * expansionFactor));
      sw.alpha = 1 - age / duration;

      // Remove finished ones (swap-and-pop for O(1) removal)
      if (sw.alpha <= 0) {
        this.shockwaves[i] = this.shockwaves[this.shockwaves.length - 1]!;
        this.shockwaves.pop();
      }
    }
  }

  // ============ Update Methods ============

  /**
   * Update all effects (call in game update phase)
   */
  public update(currentTime: number): void {
    this.currentTime = currentTime;
    this.updateExplosions(currentTime);
    this.updateDeathEffects();
    this.updateShockwaves(currentTime);
  }

  /**
   * Update explosion lifetimes and remove expired
   */
  private updateExplosions(currentTime: number): void {
    this.explosionPool.forEachActive((exp) => {
      const age = currentTime - exp.created;
      const duration =
        exp.visualEffect === VisualEffect.NUKE
          ? this.config.explosions.nukeDuration
          : this.config.explosions.standardDuration;
      exp.alpha = 1 - age / duration;

      if (exp.alpha <= 0) {
        this.explosionPool.release(exp);
      }
    });
  }

  /**
   * Update death particle physics and remove expired
   */
  private updateDeathEffects(): void {
    const friction = this.config.deathParticles.physics.friction;
    this.deathParticlePool.forEachActive((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= friction;
      p.vy *= friction;
      p.life -= p.decay;
      p.alpha = p.life;

      if (p.life <= 0) {
        this.deathParticlePool.release(p);
      }
    });
  }

  // ============ Render Methods ============

  /**
   * Render explosions (pure draw, no state mutation)
   */
  private renderExplosions(ctx: CanvasRenderingContext2D): void {
    this.explosionPool.forEachActiveForward((exp) => {
      if (exp.alpha <= 0) return;
      renderExplosion(ctx, exp);
    });
  }

  /**
   * Render death particle effects (pure draw, no state mutation)
   */
  private renderDeathEffects(ctx: CanvasRenderingContext2D): void {
    this.deathParticlePool.forEachActiveForward((p) => {
      if (p.life <= 0) return;

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
    });
  }

  /**
   * Render shockwave effects
   */
  private renderShockwaves(ctx: CanvasRenderingContext2D): void {
    for (const sw of this.shockwaves) {
      if (sw.alpha <= 0) continue;
      renderShockwave(ctx, sw);
    }
  }

  /**
   * Create death particle effect for enemy
   */
  public createDeathEffect(enemy: Enemy): void {
    const { presets, boss, bossGolden, physics } = this.config.deathParticles;
    const defaultPreset = this.config.deathParticles.default;
    const maxParticles = this.config.pool.maxDeathParticles;

    // Resolve particle preset by enemy type
    let particleCount: number;
    let particleSize: number;
    const particleColor = enemy.color;

    if (enemy.isBoss) {
      particleCount = boss.particleCount;
      particleSize = boss.particleSize;
    } else {
      const preset = presets[enemy.type] ?? defaultPreset;
      particleCount = preset.particleCount;
      particleSize = preset.particleSize;
    }

    // Creating particles (skip if pool cap reached)
    for (let i = 0; i < particleCount; i++) {
      if (this.deathParticlePool.activeCount >= maxParticles) break;

      const angle = (TWO_PI / particleCount) * i + randomRange(0, physics.angleJitter);
      const speed = randomRange(physics.speedMin, physics.speedMax);
      const p = this.deathParticlePool.acquire();

      p.x = enemy.position.x;
      p.y = enemy.position.y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = particleSize * randomRange(physics.sizeVarianceMin, physics.sizeVarianceMax);
      p.color = particleColor;
      p.alpha = 1;
      p.life = 1;
      p.decay = randomRange(physics.decayMin, physics.decayMax);
      p.isBoss = enemy.isBoss;
    }

    // Additional effect for boss - second wave of larger particles
    if (enemy.isBoss) {
      for (let i = 0; i < bossGolden.count; i++) {
        if (this.deathParticlePool.activeCount >= maxParticles) break;

        const angle = randomAngle();
        const speed = randomRange(bossGolden.speedMin, bossGolden.speedMax);
        const p = this.deathParticlePool.acquire();

        p.x = enemy.position.x;
        p.y = enemy.position.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = randomRange(bossGolden.sizeMin, bossGolden.sizeMax);
        p.color = bossGolden.color;
        p.alpha = 1;
        p.life = 1;
        p.decay = bossGolden.decay;
        p.isBoss = true;
      }
    }
  }

  /**
   * Create explosion visual effect
   */
  private createExplosion(position: Vector2, radius: number, visualEffect: VisualEffect): void {
    if (this.explosionPool.activeCount >= this.config.pool.maxExplosions) return;

    const exp = this.explosionPool.acquire();
    exp.position.x = position.x;
    exp.position.y = position.y;
    exp.radius = radius;
    exp.maxRadius = radius;
    exp.alpha = 1;
    exp.created = this.currentTime;
    exp.visualEffect = visualEffect;
  }

  /**
   * Create shockwave effect (boss attack)
   */
  private createShockwave(shockwave: {
    x: number;
    y: number;
    radius: number;
    damage: number;
    color?: string;
  }): void {
    this.shockwaves.push({
      x: shockwave.x,
      y: shockwave.y,
      maxRadius: shockwave.radius,
      currentRadius: 0,
      damage: shockwave.damage,
      color: shockwave.color ?? '',
      created: this.currentTime,
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
