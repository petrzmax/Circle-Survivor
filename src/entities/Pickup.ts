/**
 * Pickup entity class.
 * Represents collectible items dropped by enemies (gold, health, XP).
 */

import { ICollectible, IExpirable } from '@/types/components';
import { PickupType } from '@/types/enums';
import { Vector2, distance, normalize, randomAngle } from '@/utils';
import { Entity } from './Entity';

/**
 * Pickup configuration
 */
export interface PickupConfig {
  position: Vector2;
  type: PickupType;
  value: number;
  /** Lifetime in seconds (default: 30) */
  lifetime?: number;
}

/**
 * Pickup entity
 * Collectible items that move towards player when in range.
 */
export class Pickup extends Entity implements IExpirable, ICollectible {
  /** Pickup type */
  public readonly type: PickupType;

  /** Value (gold amount, heal amount, etc.) */
  public value: number;

  /** Remaining lifetime in seconds */
  public lifetime: number;

  /** Shrink duration in seconds */
  private readonly shrinkDuration: number = 1;

  /** Whether pickup is being attracted to player */
  public isAttracted: boolean = false;

  /** Attraction speed multiplier */
  private attractionSpeed: number = 5; // magnetSpeed in original

  /** Spawn time for animation */
  private spawnTime: number = Date.now();

  /** Animation offset */
  private animationOffset: number = randomAngle();

  /** Base Y position for animation */
  private baseY: number;

  public constructor(config: PickupConfig) {
    super({
      position: config.position,
      radius: 8,
    });

    this.type = config.type;
    this.value = config.value;

    // Gold: 3s, Health: 15s
    this.lifetime = config.lifetime ?? (this.type === PickupType.GOLD ? 3 : 15);
    this.baseY = config.position.y;
  }

  // ============ IExpirable ============

  /**
   * Checks if pickup has expired
   */
  public isExpired(): boolean {
    if (this.isAttracted) return false; // Don't expire while being collected
    return this.lifetime <= 0;
  }

  /**
   * Returns scale from 0 to 1 (1 = full size, 0 = disappeared)
   * For shrinking animation in last second
   */
  public getScale(): number {
    if (this.isAttracted) return 1;

    const shrinkStart = this.shrinkDuration;
    if (this.lifetime > shrinkStart) return 1;

    // Smooth shrinking in the last second
    const shrinkProgress = 1 - this.lifetime / this.shrinkDuration;
    return Math.max(0, 1 - shrinkProgress);
  }

  // ============ ICollectible ============

  /**
   * Collects the pickup
   * @returns The value of the pickup
   */
  public collect(): number {
    this.destroy();
    return this.value;
  }

  // ============ Update ============

  /**
   * Updates pickup state
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    this.lifetime -= deltaTime;

    // Up-down animation (only when not being collected)
    // TODO is it possible to animate it with css?
    if (!this.isAttracted) {
      const time = (Date.now() - this.spawnTime) / 1000;
      this.position.y = this.baseY + Math.sin(time * 3 + this.animationOffset) * 1.5;
    }

    if (this.isExpired()) {
      this.destroy();
    }
  }

  /**
   * Moves pickup towards player if in range
   * @param player Player position
   * @param pickupRange Player's pickup range
   * @param deltaTime Delta time in seconds
   */
  public updateAttraction(player: Vector2, pickupRange: number, _deltaTime: number): void {
    const dist = distance(player, this.position);

    if (dist <= pickupRange || this.isAttracted) {
      this.isAttracted = true;

      // Move towards player
      const dx = player.x - this.position.x;
      const dy = player.y - this.position.y;
      const norm = normalize({ x: dx, y: dy });

      this.position.x += norm.x * this.attractionSpeed;
      this.position.y += norm.y * this.attractionSpeed;
      this.baseY = this.position.y; // Update base position
    }
  }
}
