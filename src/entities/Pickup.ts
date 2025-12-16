/**
 * Pickup entity class.
 * Represents collectible items dropped by enemies (gold, health, XP).
 */

import { Entity } from './Entity';
import { PickupType } from '@/types/enums';
import { IExpirable, ICollectible } from '@/types/components';
import { Vector2, distance, normalize } from '@/utils';

/**
 * Pickup configuration
 */
export interface PickupConfig {
  x: number;
  y: number;
  type: PickupType;
  value: number;
  /** Lifetime in seconds (default: 30) */
  lifetime?: number;
}

/**
 * Pickup appearance by type
 */
const PICKUP_APPEARANCE: Record<PickupType, { color: string; emoji: string }> = {
  [PickupType.GOLD]: { color: '#ffd700', emoji: '💰' },
  [PickupType.HEALTH]: { color: '#ff4444', emoji: '❤️' },
};

/**
 * Pickup entity
 * Collectible items that move towards player when in range.
 */
export class Pickup extends Entity implements IExpirable, ICollectible {
  /** Pickup type */
  public readonly type: PickupType;

  /** Value (gold amount, heal amount, etc.) */
  public value: number;

  /** Color for rendering */
  public color: string;

  /** Emoji for rendering */
  public emoji: string;

  /** Remaining lifetime in seconds */
  public lifetime: number;

  /** Whether pickup is being attracted to player */
  public isAttracted: boolean = false;

  /** Attraction speed multiplier */
  private attractionSpeed: number = 8;

  /** Animation bobbing */
  private bobTimer: number = 0;

  constructor(config: PickupConfig) {
    super({
      x: config.x,
      y: config.y,
      radius: 8,
    });

    this.type = config.type;
    this.value = config.value;
    this.lifetime = config.lifetime ?? 30;

    const appearance = PICKUP_APPEARANCE[this.type];
    this.color = appearance.color;
    this.emoji = appearance.emoji;
  }

  // ============ IExpirable ============

  /**
   * Checks if pickup has expired
   */
  public isExpired(): boolean {
    return this.lifetime <= 0;
  }

  // ============ ICollectible ============

  /**
   * Checks if player is in range to collect
   */
  public isInRange(playerX: number, playerY: number, pickupRange: number): boolean {
    return distance({ x: playerX, y: playerY }, this) <= pickupRange;
  }

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
    this.bobTimer += deltaTime;

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
  public updateAttraction(
    player: Vector2,
    pickupRange: number,
    deltaTime: number
  ): void {
    const dist = distance(player, this);

    if (dist <= pickupRange) {
      this.isAttracted = true;

      // Move towards player
      const direction = normalize({
        x: player.x - this.x,
        y: player.y - this.y,
      });

      // Speed increases as pickup gets closer
      const speedMultiplier = 1 + (pickupRange - dist) / pickupRange;
      const speed = this.attractionSpeed * speedMultiplier;

      this.x += direction.x * speed * deltaTime * 60;
      this.y += direction.y * speed * deltaTime * 60;
    } else {
      this.isAttracted = false;
    }
  }

  // ============ Rendering ============

  /**
   * Draws pickup
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Bobbing animation
    const bobOffset = Math.sin(this.bobTimer * 4) * 2;

    // Fade out when about to expire
    if (this.lifetime < 5) {
      ctx.globalAlpha = 0.5 + (this.lifetime / 5) * 0.5;
    }

    // Glow when attracted
    if (this.isAttracted) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }

    // Draw based on type
    ctx.translate(this.x, this.y + bobOffset);

    // Background circle
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Emoji (if supported)
    ctx.font = `${this.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, 0, 0);

    ctx.restore();
  }
}

/**
 * Factory function to create gold pickup
 */
export function createGoldPickup(x: number, y: number, value: number): Pickup {
  return new Pickup({
    x,
    y,
    type: PickupType.GOLD,
    value,
  });
}

/**
 * Factory function to create health pickup
 */
export function createHealthPickup(x: number, y: number, value: number): Pickup {
  return new Pickup({
    x,
    y,
    type: PickupType.HEALTH,
    value,
  });
}
