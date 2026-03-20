import { randomInt } from '@/utils';
import { TWO_PI } from '@/utils/math';
import type { AttackPattern, AttackResult, EnemyBulletData } from './type';

export interface AttackContext {
  bulletDamage: number;
  bulletSpeed: number;
  color: string;
  position: { x: number; y: number };
  radius: number;
  baseAngle: number;
}

export interface AttackStrategy {
  execute(ctx: AttackContext): AttackResult;
}

function createSpreadBullets(
  ctx: AttackContext,
  spreadCount: number,
  spreadAngle: number,
): EnemyBulletData[] {
  const bullets: EnemyBulletData[] = [];
  const damagePerBullet = Math.max(ctx.bulletDamage / spreadCount, ctx.bulletDamage * 0.6);

  for (let i = 0; i < spreadCount; i++) {
    const angle =
      spreadCount === 1
        ? ctx.baseAngle
        : ctx.baseAngle - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
    bullets.push({
      x: ctx.position.x + Math.cos(angle) * ctx.radius,
      y: ctx.position.y + Math.sin(angle) * ctx.radius,
      vx: Math.cos(angle) * ctx.bulletSpeed,
      vy: Math.sin(angle) * ctx.bulletSpeed,
      damage: damagePerBullet,
      color: ctx.color,
    });
  }
  return bullets;
}

const singleAttack: AttackStrategy = {
  execute(ctx) {
    return { type: 'bullets', pattern: 'single', bullets: createSpreadBullets(ctx, 1, 0) };
  },
};

const doubleAttack: AttackStrategy = {
  execute(ctx) {
    return {
      type: 'bullets',
      pattern: 'double',
      bullets: createSpreadBullets(ctx, 2, Math.PI / 9),
    };
  },
};

const spreadAttack: AttackStrategy = {
  execute(ctx) {
    return {
      type: 'bullets',
      pattern: 'spread',
      bullets: createSpreadBullets(ctx, randomInt(4, 6), Math.PI / 3),
    };
  },
};

const aroundAttack: AttackStrategy = {
  execute(ctx) {
    return {
      type: 'bullets',
      pattern: 'around',
      bullets: createSpreadBullets(ctx, randomInt(23, 26), TWO_PI),
    };
  },
};

const shockwaveAttack: AttackStrategy = {
  execute(ctx) {
    return {
      type: 'shockwave',
      x: ctx.position.x,
      y: ctx.position.y,
      radius: ctx.radius * 3,
      damage: ctx.bulletDamage * 1.5,
      color: ctx.color,
    };
  },
};

export const ATTACK_STRATEGIES: Record<AttackPattern, AttackStrategy> = {
  single: singleAttack,
  double: doubleAttack,
  spread: spreadAttack,
  around: aroundAttack,
  shockwave: shockwaveAttack,
};
