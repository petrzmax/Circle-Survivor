/**
 * PhysicsSystem — Unified impulse→velocity→position integration with friction.
 *
 * Processes all entities with PhysicsBody + Velocity + Position traits.
 * Handles: impulse accumulation (knockback, explosions),
 * friction-based velocity decay, and Euler position integration.
 */

import { IsDead, PhysicsBody, Position, Velocity } from '@/ecs/traits';
import { world } from '@/ecs/world';
import { createQuery, Not } from 'koota';
import { singleton } from 'tsyringe';

const physicsQuery = createQuery(PhysicsBody, Velocity, Position, Not(IsDead));

@singleton()
export class PhysicsSystem {
  public update(deltaTime: number): void {
    const entities = world.query(physicsQuery);

    for (const entity of entities) {
      const body = entity.get(PhysicsBody)!;
      const vel = entity.get(Velocity)!;

      // 1. Apply accumulated impulses (velocity += impulse / mass)
      let vx = vel.vx + body.impulseX / body.mass;
      let vy = vel.vy + body.impulseY / body.mass;

      // 2. Apply friction decay (frame-rate independent)
      if (body.friction > 0) {
        const decay = Math.pow(1 - body.friction, deltaTime * 60);
        vx *= decay;
        vy *= decay;
      }

      // 3. Update velocity
      entity.set(Velocity, { vx, vy });

      // 4. Update position
      const pos = entity.get(Position)!;
      entity.set(Position, {
        x: pos.x + vx * deltaTime,
        y: pos.y + vy * deltaTime,
      });

      // 5. Clear accumulated impulses
      entity.set(PhysicsBody, {
        mass: body.mass,
        friction: body.friction,
        impulseX: 0,
        impulseY: 0,
      });
    }
  }
}
