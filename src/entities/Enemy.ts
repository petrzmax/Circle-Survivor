/**
 * Enemy entity class.
 * Represents all enemy types including basic enemies and bosses.
 */

import { AttackPattern, ENEMY_TYPES, EnemyConfig, GAME_BALANCE, generateBossName } from '@/config';
import { renderEnemy } from '@/rendering';
import { IHealth } from '@/types/components';
import { EnemyType } from '@/types/enums';
import { clamp, randomElement, Vector2 } from '@/utils';
import { distance } from '@/utils/math';
import { Entity } from './Entity';

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
  position: Vector2;
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
  public hp: number;
  public maxHp: number;

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

  public constructor(entityConfig: EnemyEntityConfig) {
    const config = ENEMY_TYPES[entityConfig.type];
    const scale = entityConfig.scale ?? 1;

    super({
      position: entityConfig.position,
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
  public takeDamage(amount: number, source: Vector2, knockbackMultiplier: number = 1): boolean {
    this.hp -= amount;

    // Apply knockback
    const knockbackStrength = this.isBoss
      ? // TODO hmm knockback is once resistance, once multiplier...
        GAME_BALANCE.boss.knockbackResistance
      : GAME_BALANCE.enemy.knockbackMultiplier;

    const dist = distance(this.position, source);
    const force = knockbackStrength * knockbackMultiplier;

    const dx = this.position.x - source.x;
    const dy = this.position.y - source.y;

    if (dist > 0) {
      this.knockbackX = (dx / dist) * force;
      this.knockbackY = (dy / dist) * force;
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
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      let moveX = (dx / dist) * this.speed;
      let moveY = (dy / dist) * this.speed;

      // Zigzag movement
      if (this.zigzag) {
        moveX += (-dy / dist) * this.speed * 0.8 * this.zigzagDir;
        moveY += (dx / dist) * this.speed * 0.8 * this.zigzagDir;
      }

      this.position.x += moveX + this.knockbackX;
      this.position.y += moveY + this.knockbackY;
    }

    // Check if enemy entered arena
    const isFullyInside =
      this.position.x > this.radius &&
      this.position.x < canvasWidth - this.radius &&
      this.position.y > this.radius &&
      this.position.y < canvasHeight - this.radius;

    if (isFullyInside) {
      this.hasEnteredArena = true;
    }

    // Limit position only if already inside
    if (this.hasEnteredArena) {
      this.position.x = clamp(this.position.x, this.radius, canvasWidth - this.radius);
      this.position.y = clamp(this.position.y, this.radius, canvasHeight - this.radius);
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
    const pattern = randomElement(this.attackPatterns);

    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
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
            x: this.position.x,
            y: this.position.y,
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
          x: this.position.x,
          y: this.position.y,
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
              x: this.position.x,
              y: this.position.y,
              vx: (dx / dist) * this.bulletSpeed,
              vy: (dy / dist) * this.bulletSpeed,
              damage: this.bulletDamage,
              color: this.color,
            },
          ],
        };
    }
  }

  // TODO: move to RenderSystem
  /**
   * Draws enemy
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    renderEnemy(ctx, this);
  }
}
