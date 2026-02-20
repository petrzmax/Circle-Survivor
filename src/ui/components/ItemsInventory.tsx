import { SHOP_ITEMS } from '@/config/shop.config';
import { STAT_LABELS } from '@/config/stats-labels.config';
import { Player } from '@/domain/player/Player';
import { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { useItemTooltip } from '../hooks/useItemTooltip';
import { ItemTooltip } from './ItemTooltip';

/**
 * Stats displayed in the Przedmioty tab.
 * Uses shared STAT_LABELS for emoji/label, adds player-specific format functions.
 * To add a new stat, just add an entry to this array.
 */
const DISPLAYED_STATS: ReadonlyArray<{
  key: string;
  emoji: string;
  label: string;
  format: (player: Player) => string;
}> = [
  // Defensive
  {
    key: 'maxHp',
    ...STAT_LABELS.maxHp,
    format: (p) => `${p.maxHp}`,
  },
  {
    key: 'armor',
    ...STAT_LABELS.armor,
    format: (p) => `${Math.round((p.armor / (p.armor + 100)) * 100)}%`,
  },
  {
    key: 'dodge',
    ...STAT_LABELS.dodge,
    format: (p) => `${Math.round(p.dodge * 100)}%`,
  },
  {
    key: 'regen',
    ...STAT_LABELS.regen,
    format: (p) => `${p.regen.toFixed(1)}/s`,
  },
  {
    key: 'thorns',
    ...STAT_LABELS.thorns,
    format: (p) => `${Math.round(p.thorns * 100)}%`,
  },
  {
    key: 'lifesteal',
    ...STAT_LABELS.lifesteal,
    format: (p) => `${Math.round(p.lifesteal * 100)}%`,
  },
  // Offensive
  {
    key: 'damageMultiplier',
    ...STAT_LABELS.damageMultiplier,
    format: (p) => `+${Math.round((p.damageMultiplier - 1) * 100)}%`,
  },
  {
    key: 'critChance',
    ...STAT_LABELS.critChance,
    format: (p) => `${Math.round(p.critChance * 100)}%`,
  },
  {
    key: 'critDamage',
    ...STAT_LABELS.critDamage,
    format: (p) => `+${Math.round((p.critDamage - 1) * 100)}%`,
  },
  {
    key: 'attackSpeedMultiplier',
    ...STAT_LABELS.attackSpeedMultiplier,
    format: (p) => `+${Math.round((p.attackSpeedMultiplier - 1) * 100)}%`,
  },
  {
    key: 'attackRange',
    ...STAT_LABELS.attackRange,
    format: (p) => `+${Math.round((p.attackRange - 1) * 100)}%`,
  },
  {
    key: 'explosionRadius',
    ...STAT_LABELS.explosionRadius,
    format: (p) => `+${Math.round((p.explosionRadius - 1) * 100)}%`,
  },
  {
    key: 'knockback',
    ...STAT_LABELS.knockback,
    format: (p) => `+${Math.round((p.knockback - 1) * 100)}%`,
  },
  // Utility
  {
    key: 'speed',
    ...STAT_LABELS.speed,
    format: (p) => `+${Math.round((p.speedMultiplier - 1) * 100)}%`,
  },
  {
    key: 'pickupRange',
    ...STAT_LABELS.pickupRange,
    format: (p) => `${Math.round(p.pickupRange)}`,
  },
  {
    key: 'luck',
    ...STAT_LABELS.luck,
    format: (p) => `+${Math.round(p.luck * 100)}%`,
  },
  {
    key: 'xpMultiplier',
    ...STAT_LABELS.xpMultiplier,
    format: (p) => `+${Math.round((p.xpMultiplier - 1) * 100)}%`,
  },
  {
    key: 'goldMultiplier',
    ...STAT_LABELS.goldMultiplier,
    format: (p) => `+${Math.round((p.goldMultiplier - 1) * 100)}%`,
  },
];

interface ItemsInventoryProps {
  player: Player;
}

export function ItemsInventory({ player }: ItemsInventoryProps): JSX.Element {
  const itemTooltip = useItemTooltip();

  const groupedItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const itemId of player.items) {
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
    return counts;
  }, [player.items]);

  return (
    <div class="items-inventory" onMouseMove={itemTooltip.handleMouseMove}>
      {/* Left Column - Items */}
      <div class="items-column-left">
        <div class="items-section-label">📦 Przedmioty</div>
        {groupedItems.size === 0 ? (
          <div class="items-empty">Brak przedmiotów</div>
        ) : (
          <div class="items-list">
            {Array.from(groupedItems.entries()).map(([itemId, count]) => {
              const item = SHOP_ITEMS[itemId];
              if (!item || item.type === 'weapon') return null;
              return (
                <div
                  class="item-entry"
                  key={itemId}
                  onMouseEnter={(): void => {
                    itemTooltip.showTooltip(itemId);
                  }}
                  onMouseLeave={itemTooltip.hideTooltip}
                >
                  <span class="item-emoji">{item.emoji}</span>
                  <span class="item-name">{item.name}</span>
                  {count > 1 && <span class="item-count">×{count}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column - Stats */}
      <div class="items-column-right">
        <div class="items-section-label">📊 Statystyki</div>
        <div class="items-stats">
          {DISPLAYED_STATS.map((stat) => {
            const formatted = stat.format(player);
            const numVal = parseFloat(formatted);
            const colorClass =
              numVal > 0 ? 'stat-positive' : numVal < 0 ? 'stat-negative' : 'stat-neutral';
            return (
              <div class="items-stat" key={stat.key}>
                <span>
                  {stat.emoji} {stat.label}
                </span>
                <span class={`items-stat-value ${colorClass}`}>{formatted}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ItemTooltip itemData={itemTooltip.hoveredItem} position={itemTooltip.mousePosition} />
    </div>
  );
}
