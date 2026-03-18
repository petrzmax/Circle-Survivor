/**
 * PhysicsSystem — Unified impulse→velocity→position integration with friction.
 *
 * Processes all entities with PhysicsBody + Velocity + Position traits.
 * Handles: impulse accumulation (knockback, explosions),
 * friction-based velocity decay, and Euler position integration.
 */

import { Collider, PhysicsBody, Position, Velocity } from '@/ecs/traits';
import { ConfigService } from '@/config/ConfigService';
import type { CanvasBounds } from '@/utils';
import { clampCircleToBounds } from '@/utils/collision';
import { EntityManager } from '@/managers/EntityManager';
import { singleton } from 'tsyringe';

@singleton()
export class PhysicsSystem {
  private readonly canvasBounds: CanvasBounds;

  public constructor(
    private entityManager: EntityManager,
    configService: ConfigService,
  ) {
    this.canvasBounds = configService.getCanvasBounds();
  }

  public update(deltaTime: number): void {
    const entities = this.entityManager.getPhysicsEntities();

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

    // 6. Clamp arena-bound entities to canvas borders
    this.clampArenaBoundEntities();
  }

  private clampArenaBoundEntities(): void {
    const entities = this.entityManager.getArenaBoundEntities();

    for (const entity of entities) {
      const pos = entity.get(Position)!;
      const r = entity.get(Collider)!.radius;
      const clamped = clampCircleToBounds(pos, r, this.canvasBounds);

      if (clamped.x !== pos.x || clamped.y !== pos.y) {
        entity.set(Position, { x: clamped.x, y: clamped.y });

        // Zero out velocity component on clamped axis to prevent sliding along walls
        const vel = entity.get(Velocity)!;
        entity.set(Velocity, {
          vx: clamped.x !== pos.x ? 0 : vel.vx,
          vy: clamped.y !== pos.y ? 0 : vel.vy,
        });
      }
    }
  }
}
