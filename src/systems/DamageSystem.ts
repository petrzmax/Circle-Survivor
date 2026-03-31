/**
 * DamageSystem — Single authority for all HP modifications.
 *
 * Defense-side only: armor, dodge, invincibility.
 * Callers pre-compute final offense damage before calling damageEntity().
 * Knockback impulses are the caller's responsibility (CollisionResponseSystem, ExplosionSystem).
 *
 * Operates on raw Koota Entity — reads Health, Position (SoA),
 * and PlayerStats (AoS, for defense stats like armor/dodge/invincibility).
 */
import { Health, PlayerStats, Position } from '@/ecs/traits';
import { healEntity } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { TimeManager } from '@/managers/TimeManager';
import { CombatMath } from '@/utils/combat-math';
import type { Vector2 } from '@/utils/math';
import { randomChance } from '@/utils/random';
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { DamageResult, DamageSource } from './damage.types';

@singleton()
export class DamageSystem {
  public constructor(
    private combatMath: CombatMath,
    private timeManager: TimeManager,
  ) {}

  /**
   * Apply damage to any entity with Health and Position traits.
   *
   * Flow: godMode → invincibility → dodge → armor → subtract HP → knockback → event.
   * Defense stats (armor, dodge, godMode, invincibility) are read from PlayerStats
   * if present — enemies without PlayerStats are treated as unarmored.
   *
   * @param target       The Koota entity receiving damage
   * @param incomingDamage  Final offense-side damage (caller already applied multipliers)
   * @param source       Position the damage came from (for event reporting)
   * @param damageSource Categorized source type for events
   */
  public damageEntity(
    target: Entity,
    incomingDamage: number,
    source: Vector2,
    damageSource: DamageSource,
  ): DamageResult {
    // Read defense stats from PlayerStats (only player has them)
    const stats = target.get(PlayerStats);
    const isPlayer = !!stats;

    // God mode — immune
    if (stats?.godMode) {
      return { actualDamage: 0, isDead: false };
    }

    // Invincibility frames
    const currentTime = this.timeManager.getElapsed();
    if (stats && currentTime < stats.invincibleUntil) {
      return { actualDamage: 0, isDead: false };
    }

    // Dodge check (per-attack — each hit rolls independently)
    if (stats && randomChance(stats.dodge)) {
      EventBus.emit('playerDodged', undefined);
      return { actualDamage: 0, isDead: false };
    }

    // Armor diminishing returns
    let finalDamage = incomingDamage;
    const armor = stats?.armor ?? 0;
    if (armor > 0) {
      const reduction = this.combatMath.armorReduction(armor);
      finalDamage = incomingDamage * (1 - reduction);
    }

    // Subtract HP (SoA — must use entity.set())
    // Inline: needs newHp for isDead check and clamps to 0 (generic util doesn't).
    const h = target.get(Health)!;
    const newHp = Math.max(0, h.hp - finalDamage);
    target.set(Health, { hp: newHp, maxHp: h.maxHp });

    // Set invincibility (AoS — direct mutation OK)
    if (stats && stats.invincibilityDuration > 0) {
      stats.invincibleUntil = currentTime + stats.invincibilityDuration;
    }

    // Emit typed damage event
    EventBus.emit('entityDamaged', {
      entityId: target.id(),
      damage: finalDamage,
      source,
      damageSource,
      isPlayer,
    });

    return {
      actualDamage: finalDamage,
      isDead: newHp <= 0,
    };
  }

  /**
   * Attempt lifesteal heal on the player entity.
   */
  public applyLifesteal(playerEntity: Entity): void {
    const stats = playerEntity.get(PlayerStats);
    if (!stats) return;
    if (randomChance(stats.lifesteal)) {
      healEntity(playerEntity, 1);
    }
  }

  /**
   * Reflect thorns damage back to the attacker.
   *
   * @param playerEntity  The player who took damage (source of thorns)
   * @param attacker      The enemy entity that dealt damage (receives thorns damage)
   * @param actualDamage  The actual damage the player received (after armor)
   * @param currentTime   Current game time
   */
  public applyThorns(playerEntity: Entity, attacker: Entity, actualDamage: number): DamageResult {
    const stats = playerEntity.get(PlayerStats);
    if (!stats || stats.thorns <= 0 || actualDamage <= 0) {
      return { actualDamage: 0, isDead: false };
    }

    EventBus.emit('thornsTriggered', undefined);
    const thornsDamage = actualDamage * stats.thorns;

    // Thorns damage bypasses attacker's armor/dodge — raw damage to HP
    return this.damageEntity(attacker, thornsDamage, attacker.get(Position)!, DamageSource.THORNS);
  }
}
