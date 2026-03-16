import { useEffect, useState } from 'preact/hooks';
import { EventBus } from '@/events/EventBus';
import { Health, PlayerStats, WeaponInventory } from '@/ecs/traits';
import { EntityManager } from '@/managers';
import type { PlayerData } from '@/domain/player/type';
export type { PlayerData } from '@/domain/player/type';
import { container } from 'tsyringe';

const entityManager = container.resolve(EntityManager);

function buildPlayerData(): PlayerData | null {
  if (!entityManager.hasPlayer()) return null;
  const entity = entityManager.getPlayerEntity();
  const h = entity.get(Health)!;
  const stats = entity.get(PlayerStats)!;
  const inv = entity.get(WeaponInventory)!;
  return {
    hp: h.hp,
    maxHp: h.maxHp,
    gold: stats.gold,
    xp: stats.xp,
    weapons: inv.weapons,
    maxWeapons: stats.maxWeapons,
    items: inv.items,
    armor: stats.armor,
    dodge: stats.dodge,
    regen: stats.regen,
    thorns: stats.thorns,
    lifesteal: stats.lifesteal,
    damageMultiplier: stats.damageMultiplier,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    attackSpeedMultiplier: stats.attackSpeedMultiplier,
    attackRange: stats.attackRange,
    explosionRadius: stats.explosionRadius,
    knockback: stats.knockback,
    speedMultiplier: stats.speedMultiplier,
    pickupRange: stats.pickupRange,
    luck: stats.luck,
    xpMultiplier: stats.xpMultiplier,
    goldMultiplier: stats.goldMultiplier,
  };
}

/**
 * Hook that returns player data snapshot for UI rendering.
 * Uses events as re-render triggers — reads from ECS traits directly.
 * Returns null before character selection (player doesn't exist yet).
 */
export function usePlayer(): PlayerData | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const rerender = (): void => {
      forceUpdate((n) => n + 1);
    };

    const subs = [
      EventBus.on('hudUpdate', rerender),
      EventBus.on('shopPlayerUpdated', rerender),
      EventBus.on('stateEntered', rerender),
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  return buildPlayerData();
}
