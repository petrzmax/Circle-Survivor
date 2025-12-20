/**
 * Enemy entity class.
 * Represents all enemy types including basic enemies and bosses.
 */

import { Entity } from './Entity';
import { EnemyType } from '@/types/enums';
import { IHealth } from '@/types/components';
import { ENEMY_TYPES, EnemyConfig, AttackPattern, generateBossName } from '@/config';
import { GAME_BALANCE } from '@/config';
import { Vector2, clamp } from '@/utils';

/**
 * Attack result types
 */
export interface BulletAttackResult {
  type: 'bullets';
  bullets: EnemyBulletData[];
}

export interface ShockwaveAttackResult {
  type: 'shockwave';
  x: number;
  y: number;
  radius: number;
  damage: number;
  color: string;
}

export type AttackResult = BulletAttackResult | ShockwaveAttackResult | null;

/**
 * Enemy bullet data (to be created by weapon system)
 */
export interface EnemyBulletData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
}

/**
 * Enemy configuration for constructor
 */
export interface EnemyEntityConfig {
  x: number;
  y: number;
  type: EnemyType;
  /** Scale multiplier for split enemies */
  scale?: number;
}

/**
 * Enemy entity
 * Uses config from ENEMY_TYPES for stats.
 */
export class Enemy extends Entity implements IHealth {
  /** Enemy type */
  public readonly type: EnemyType;

  /** Type configuration reference */
  public readonly config: EnemyConfig;

  /** Enemy color */
  public color: string;

  /** Movement speed */
  public speed: number;

  // ============ Health Component ============

  /** Maximum HP */
  public maxHp: number;

  /** Current HP */
  public hp: number;

  // ============ Rewards ============

  /** XP value when killed */
  public xpValue: number;

  /** Gold value when killed */
  public goldValue: number;

  /** Contact damage */
  public damage: number;

  // ============ Special Properties ============

  /** Boss flag */
  public readonly isBoss: boolean;

  /** Boss name (generated) */
  public bossName: string | null = null;

  /** Has top health bar (boss HP bar at top of screen) */
  public hasTopHealthBar: boolean = false;

  /** Ghost phasing effect */
  public phasing: boolean;

  /** Zigzag movement */
  public zigzag: boolean;

  /** Explode on death */
  public explodeOnDeath: boolean;
  public explosionRadius: number;
  public explosionDamage: number;

  /** Split on death */
  public splitOnDeath: boolean;
  public splitCount: number;

  // ============ Shooting (for bosses/tanks) ============

  /** Can shoot projectiles */
  public canShoot: boolean;
  public fireRate: number;
  public bulletSpeed: number;
  public bulletDamage: number;
  public attackPatterns: AttackPattern[];
  public lastFireTime: number = 0;

  // ============ Movement State ============

  /** Knockback velocity */
  public knockbackX: number = 0;
  public knockbackY: number = 0;

  /** Zigzag timer */
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;

  /** Whether enemy has fully entered the arena */
  public hasEnteredArena: boolean = false;

  /** Scale multiplier (for split enemies) */
  public readonly scale: number;

  constructor(entityConfig: EnemyEntityConfig) {
    const config = ENEMY_TYPES[entityConfig.type];
    const scale = entityConfig.scale ?? 1;

    super({
      x: entityConfig.x,
      y: entityConfig.y,
      radius: config.radius * scale,
    });

    this.type = entityConfig.type;
    this.config = config;
    this.scale = scale;

    // Basic stats (scaled)
    this.color = config.color;
    this.speed = config.speed;
    this.maxHp = Math.floor(config.hp * scale);
    this.hp = this.maxHp;
    this.damage = Math.floor(config.damage * scale);
    this.xpValue = Math.floor(config.xpValue * scale);
    this.goldValue = Math.floor(config.goldValue * scale);

    // Special properties
    this.isBoss = config.isBoss ?? false;
    this.phasing = config.phasing ?? false;
    this.zigzag = config.zigzag ?? false;

    this.explodeOnDeath = config.explodeOnDeath ?? false;
    this.explosionRadius = (config.explosionRadius ?? 0) * scale;
    this.explosionDamage = Math.floor((config.explosionDamage ?? 0) * scale);

    this.splitOnDeath = config.splitOnDeath ?? false;
    this.splitCount = config.splitCount ?? 0;

    // Shooting properties
    this.canShoot = config.canShoot ?? false;
    this.fireRate = config.fireRate ?? 2000;
    this.bulletSpeed = config.bulletSpeed ?? 4;
    this.bulletDamage = Math.floor((config.bulletDamage ?? 15) * scale);
    this.attackPatterns = config.attackPatterns ?? ['single'];

    // Boss name
    if (this.isBoss) {
      this.bossName = generateBossName();
      this.hasTopHealthBar = true; // Boss uses top screen HP bar, not mini bar
    }
  }

  // ============ Health Interface ============

  /**
   * Takes damage and applies knockback
   * @returns true if enemy died
   */
  public takeDamage(
    amount: number,
    sourceX: number,
    sourceY: number,
    knockbackMultiplier: number = 1,
  ): boolean {
    this.hp -= amount;

    // Apply knockback
    const knockbackStrength = this.isBoss
      ? GAME_BALANCE.boss.knockbackResistance
      : GAME_BALANCE.enemy.knockbackMultiplier;

    const dx = this.x - sourceX;
    const dy = this.y - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.knockbackX = (dx / dist) * knockbackStrength * knockbackMultiplier;
      this.knockbackY = (dy / dist) * knockbackStrength * knockbackMultiplier;
    }

    return this.hp <= 0;
  }

  /**
   * Heals the enemy
   */
  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Checks if enemy is dead
   */
  public isDead(): boolean {
    return this.hp <= 0;
  }

  // ============ Movement ============

  /**
   * Updates enemy state
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Reduce knockback
    this.knockbackX *= 0.8;
    this.knockbackY *= 0.8;

    // Zigzag timer update
    if (this.zigzag) {
      this.zigzagTimer += deltaTime * 1000; // Convert to ms
      if (this.zigzagTimer > 200) {
        this.zigzagTimer = 0;
        this.zigzagDir *= -1;
      }
    }
  }

  /**
   * Moves enemy towards target (usually player)
   * Call this separately from update for more control
   */
  public moveTowardsTarget(
    target: Vector2,
    _deltaTime: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      let moveX = (dx / dist) * this.speed;
      let moveY = (dy / dist) * this.speed;

      // Zigzag movement
      if (this.zigzag) {
        moveX += (-dy / dist) * this.speed * 0.8 * this.zigzagDir;
        moveY += (dx / dist) * this.speed * 0.8 * this.zigzagDir;
      }

      this.x += moveX + this.knockbackX;
      this.y += moveY + this.knockbackY;
    }

    // Check if enemy entered arena
    const isFullyInside =
      this.x > this.radius &&
      this.x < canvasWidth - this.radius &&
      this.y > this.radius &&
      this.y < canvasHeight - this.radius;

    if (isFullyInside) {
      this.hasEnteredArena = true;
    }

    // Limit position only if already inside
    if (this.hasEnteredArena) {
      this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
      this.y = clamp(this.y, this.radius, canvasHeight - this.radius);
    }
  }

  // ============ Combat ============

  /**
   * Attempts to attack (for shooting enemies)
   * @returns Attack result or null
   */
  public tryAttack(target: Vector2, currentTime: number): AttackResult {
    if (!this.canShoot) return null;
    if (currentTime - this.lastFireTime < this.fireRate) return null;

    this.lastFireTime = currentTime;

    // Random pattern
    const pattern = this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)];

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return null;

    const baseAngle = Math.atan2(dy, dx);

    switch (pattern) {
      case 'spread': {
        const bullets: EnemyBulletData[] = [];
        const spreadCount = 5;
        const spreadAngle = Math.PI / 3; // 60 degrees

        for (let i = 0; i < spreadCount; i++) {
          const angle = baseAngle - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
          bullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * this.bulletSpeed,
            vy: Math.sin(angle) * this.bulletSpeed,
            damage: this.bulletDamage * 0.6,
            color: this.color,
          });
        }
        return { type: 'bullets', bullets };
      }

      case 'shockwave':
        return {
          type: 'shockwave',
          x: this.x,
          y: this.y,
          radius: this.radius * 3,
          damage: this.bulletDamage * 1.5,
          color: this.color,
        };

      case 'single':
      default:
        return {
          type: 'bullets',
          bullets: [
            {
              x: this.x,
              y: this.y,
              vx: (dx / dist) * this.bulletSpeed,
              vy: (dy / dist) * this.bulletSpeed,
              damage: this.bulletDamage,
              color: this.color,
            },
          ],
        };
    }
  }

  // ============ Rendering ============

  /**
   * Draws enemy
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Ghost transparency
    if (this.phasing) {
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.2;
    }

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // HP bar (only if damaged, and not for bosses with top health bar)
    if (this.hp < this.maxHp && !this.hasTopHealthBar) {
      this.drawHealthBar(ctx);
    }

    // Eyes
    this.drawEyes(ctx);

    // Boss crown and name
    if (this.isBoss) {
      this.drawBossCrown(ctx);
    }

    // Exploder glow
    if (this.explodeOnDeath) {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10 + Math.sin(Date.now() / 100) * 5;
    }

    ctx.restore();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
  }

  private drawEyes(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.2,
      this.radius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      this.x + this.radius * 0.3,
      this.y - this.radius * 0.2,
      this.radius * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - this.radius * 0.5, this.y - this.radius * 0.4);
    ctx.lineTo(this.x - this.radius * 0.1, this.y - this.radius * 0.5);
    ctx.moveTo(this.x + this.radius * 0.5, this.y - this.radius * 0.4);
    ctx.lineTo(this.x + this.radius * 0.1, this.y - this.radius * 0.5);
    ctx.stroke();
  }

  private drawBossCrown(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(this.x - 20, this.y - this.radius - 5);
    ctx.lineTo(this.x - 15, this.y - this.radius - 20);
    ctx.lineTo(this.x - 5, this.y - this.radius - 10);
    ctx.lineTo(this.x, this.y - this.radius - 25);
    ctx.lineTo(this.x + 5, this.y - this.radius - 10);
    ctx.lineTo(this.x + 15, this.y - this.radius - 20);
    ctx.lineTo(this.x + 20, this.y - this.radius - 5);
    ctx.closePath();
    ctx.fill();

    // Boss name
    if (this.bossName) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(this.bossName, this.x, this.y - this.radius - 35);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(this.bossName, this.x, this.y - this.radius - 35);
    }
  }
}
