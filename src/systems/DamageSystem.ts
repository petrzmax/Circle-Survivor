/**
 * DamageSystem — Single authority for all HP modifications.
 *
 * Defense-side only: armor, dodge, knockback (via PhysicsBody force), invincibility.
 * Callers pre-compute final offense damage before calling damageEntity().
 *
 * Operates on raw Koota Entity — reads Health, Position (SoA),
 * and PlayerStats (AoS, for defense stats like armor/dodge/invincibility).
 */
import type { Entity } from 'koota';
import { singleton } from 'tsyringe';
import { ConfigService } from '@/config/ConfigService';
import { Health, IsBoss, PlayerStats, Position } from '@/ecs/traits';
import { applyForce, healEntity } from '@/ecs/utils/entity-utils';
import { EventBus } from '@/events/EventBus';
import { distance, Vector2 } from '@/utils/math';
import { randomChance } from '@/utils/random';
import { CombatMath } from '@/utils/combat-math';
import { DamageResult, DamageSource } from './damage.types';

@singleton()
export class DamageSystem {
  private readonly knockbackForce: number;

  public constructor(
    private combatMath: CombatMath,
    configService: ConfigService,
  ) {
    this.knockbackForce = configService.getEnemyBalance().knockbackForce;
  }

  /**
   * Apply damage to any entity with Health and Position traits.
   *
   * Flow: godMode → invincibility → dodge → armor → subtract HP → knockback → event.
   * Defense stats (armor, dodge, godMode, invincibility) are read from PlayerStats
   * if present — enemies without PlayerStats are treated as unarmored.
   *
   * @param target       The Koota entity receiving damage
   * @param incomingDamage  Final offense-side damage (caller already applied multipliers)
   * @param currentTime  Current game time in ms (for invincibility checks)
   * @param source       Position the damage came from (for knockback direction)
   * @param damageSource Categorized source type for events
   * @param knockbackMultiplier  Knockback force multiplier (default 1)
   * @param isBoss       Whether the target is a boss (affects knockback weight)
   */
  public damageEntity(
    target: Entity,
    incomingDamage: number,
    currentTime: number,
    source: Vector2,
    damageSource: DamageSource,
    knockbackMultiplier: number = 1,
    isBoss: boolean = false,
  ): DamageResult {
    // Read defense stats from PlayerStats (only player has them)
    const stats = target.get(PlayerStats);
    const isPlayer = !!stats;

    // God mode — immune
    if (stats?.godMode) {
      return { actualDamage: 0, isDead: false };
    }

    // Invincibility frames
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

    // Apply directional knockback
    this.applyKnockback(target, source, knockbackMultiplier, isBoss);

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
  public applyThorns(
    playerEntity: Entity,
    attacker: Entity,
    actualDamage: number,
    currentTime: number,
  ): DamageResult {
    const stats = playerEntity.get(PlayerStats);
    if (!stats || stats.thorns <= 0 || actualDamage <= 0) {
      return { actualDamage: 0, isDead: false };
    }

    EventBus.emit('thornsTriggered', undefined);
    const thornsDamage = actualDamage * stats.thorns;
    const isBoss = attacker.has(IsBoss);

    // Thorns damage bypasses attacker's armor/dodge — raw damage to HP + knockback
    return this.damageEntity(
      attacker,
      thornsDamage,
      currentTime,
      attacker.get(Position)!,
      DamageSource.THORNS,
      stats.knockback,
      isBoss,
    );
  }

  /**
   * Apply directional knockback as a force on PhysicsBody.
   */
  private applyKnockback(
    target: Entity,
    source: Vector2,
    knockbackMultiplier: number,
    _isBoss: boolean,
  ): void {
    const pos = target.get(Position)!;
    const dist = distance(pos, source);
    const force = this.knockbackForce * knockbackMultiplier;

    if (dist > 0) {
      const dx = pos.x - source.x;
      const dy = pos.y - source.y;
      applyForce(target, (dx / dist) * force, (dy / dist) * force);
    }
  }
}
