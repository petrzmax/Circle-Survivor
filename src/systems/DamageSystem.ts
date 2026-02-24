/**
 * DamageSystem — Single authority for all HP modifications.
 *
 * Defense-side only: armor, dodge, knockback, invincibility.
 * Callers pre-compute final offense damage before calling damageEntity().
 */
import { singleton } from 'tsyringe';
import { ConfigService } from '@/config/ConfigService';
import { EventBus } from '@/events/EventBus';
import { distance, Vector2 } from '@/utils/math';
import { randomChance } from '@/utils/random';
import { CombatMath, healEntity } from '@/utils/combat-math';
import { DamageResult, DamageSource, IDamageable } from './damage.types';

@singleton()
export class DamageSystem {
  private readonly enemyKnockbackWeight: number;
  private readonly bossKnockbackWeight: number;

  public constructor(
    private combatMath: CombatMath,
    configService: ConfigService,
  ) {
    this.enemyKnockbackWeight = configService.getEnemyBalance().knockbackWeight;
    this.bossKnockbackWeight = configService.getBossBalance().knockbackWeight;
  }

  /**
   * Apply damage to any IDamageable target.
   *
   * Flow: godMode → invincibility → dodge → armor → subtract HP → knockback → event.
   *
   * @param target       The entity receiving damage (Player or Enemy via IDamageable)
   * @param incomingDamage  Final offense-side damage (caller already applied multipliers)
   * @param currentTime  Current game time in ms (for invincibility checks)
   * @param source       Position the damage came from (for knockback direction)
   * @param damageSource Categorized source type for events
   * @param knockbackMultiplier  Knockback force multiplier (default 1)
   * @param isBoss       Whether the target is a boss (affects knockback weight)
   */
  public damageEntity(
    target: IDamageable,
    incomingDamage: number,
    currentTime: number,
    source: Vector2,
    damageSource: DamageSource,
    knockbackMultiplier: number = 1,
    isBoss: boolean = false,
    isPlayer: boolean = false,
  ): DamageResult {
    // God mode — immune
    if (target.godMode) {
      return { actualDamage: 0, isDead: false };
    }

    // Invincibility frames
    if (currentTime < (target.invincibleUntil ?? 0)) {
      return { actualDamage: 0, isDead: false };
    }

    // Dodge check (per-attack — each hit rolls independently)
    if (randomChance(target.dodge ?? 0)) {
      if (isPlayer) {
        EventBus.emit('playerDodged', undefined);
      }
      return { actualDamage: 0, isDead: false };
    }

    // Armor diminishing returns
    let finalDamage = incomingDamage;
    const armor = target.armor ?? 0;
    if (armor > 0) {
      const reduction = this.combatMath.armorReduction(armor);
      finalDamage = incomingDamage * (1 - reduction);
    }

    // Subtract HP
    target.hp = Math.max(0, target.hp - finalDamage);

    // Set invincibility
    const invincibilityDuration = target.invincibilityDuration ?? 0;
    if (invincibilityDuration > 0) {
      target.invincibleUntil = currentTime + invincibilityDuration;
    }

    // Apply directional knockback
    this.applyKnockback(target, source, knockbackMultiplier, isBoss);

    // Emit typed damage event
    EventBus.emit('entityDamaged', {
      entityId: target.id,
      damage: finalDamage,
      source,
      damageSource,
      isPlayer,
    });

    return {
      actualDamage: finalDamage,
      isDead: target.hp <= 0,
    };
  }

  /**
   * Attempt lifesteal heal on the player.
   * Called after a successful hit on an enemy.
   */
  public applyLifesteal(player: IDamageable & { lifesteal: number }): void {
    if (randomChance(player.lifesteal)) {
      healEntity(player, 1);
    }
  }

  /**
   * Reflect thorns damage back to the attacker.
   * Works for all incoming damage sources that have a traceable attacker entity.
   *
   * @param player       The player who took damage (source of thorns)
   * @param attacker     The entity that dealt damage (receives thorns damage)
   * @param actualDamage The actual damage the player received (after armor)
   * @param currentTime  Current game time
   * @param isBoss       Whether the attacker is a boss
   */
  public applyThorns(
    player: IDamageable & { thorns: number; knockback: number },
    attacker: IDamageable,
    actualDamage: number,
    currentTime: number,
    isBoss: boolean = false,
  ): DamageResult {
    if (player.thorns <= 0 || actualDamage <= 0) {
      return { actualDamage: 0, isDead: false };
    }

    EventBus.emit('thornsTriggered', undefined);
    const thornsDamage = actualDamage * player.thorns;

    // Thorns damage bypasses attacker's armor/dodge — raw damage to HP + knockback
    return this.damageEntity(
      attacker,
      thornsDamage,
      currentTime,
      attacker.position,
      DamageSource.THORNS,
      player.knockback,
      isBoss,
    );
  }

  /**
   * Apply directional knockback away from the damage source.
   */
  private applyKnockback(
    target: IDamageable,
    source: Vector2,
    knockbackMultiplier: number,
    isBoss: boolean,
  ): void {
    const knockbackWeight = isBoss ? this.bossKnockbackWeight : this.enemyKnockbackWeight;
    const dist = distance(target.position, source);
    const force = knockbackWeight * knockbackMultiplier;

    if (dist > 0) {
      const dx = target.position.x - source.x;
      const dy = target.position.y - source.y;
      target.knockbackX = (dx / dist) * force;
      target.knockbackY = (dy / dist) * force;
    }
  }
}
