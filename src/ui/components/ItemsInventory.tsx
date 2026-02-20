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
    key: 'dodge',
    ...STAT_LABELS.dodge,
    format: (p) => `${Math.round(p.dodge * 100)}%`,
  },
  {
    key: 'regen',
    ...STAT_LABELS.regen,
    format: (p) => `${p.regen.toFixed(1)}/s`,
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
      {/* Stats Section */}
      <div class="items-stats">
        {DISPLAYED_STATS.map((stat) => (
          <div class="items-stat" key={stat.key}>
            {stat.emoji} {stat.label}: <span class="items-stat-value">{stat.format(player)}</span>
          </div>
        ))}
      </div>

      {/* Items Section */}
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
      <ItemTooltip itemData={itemTooltip.hoveredItem} position={itemTooltip.mousePosition} />
    </div>
  );
}
