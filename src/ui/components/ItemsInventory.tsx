import { SHOP_ITEMS } from '@/config/shop.config';
import { Player } from '@/domain/player/Player';
import { JSX } from 'preact';
import { useMemo } from 'preact/hooks';

/**
 * Stats displayed in the Przedmioty tab.
 * To add a new stat, just add an entry to this array.
 */
const DISPLAYED_STATS: ReadonlyArray<{
  emoji: string;
  label: string;
  format: (player: Player) => string;
}> = [
  {
    emoji: '❤️',
    label: 'HP',
    format: (p) => `${p.maxHp}`,
  },
  {
    emoji: '🛡️',
    label: 'Pancerz',
    format: (p) => `${Math.round((p.armor / (p.armor + 100)) * 100)}%`,
  },
  {
    emoji: '⚔️',
    label: 'Obrażenia',
    format: (p) => `+${Math.round((p.damageMultiplier - 1) * 100)}%`,
  },
  {
    emoji: '🎯',
    label: 'Krytyk',
    format: (p) => `${Math.round(p.critChance * 100)}%`,
  },
  {
    emoji: '💨',
    label: 'Unik',
    format: (p) => `${Math.round(p.dodge * 100)}%`,
  },
  {
    emoji: '💚',
    label: 'Regeneracja',
    format: (p) => `${p.regen.toFixed(1)}/s`,
  },
];

interface ItemsInventoryProps {
  player: Player;
}

export function ItemsInventory({ player }: ItemsInventoryProps): JSX.Element {
  const groupedItems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const itemId of player.items) {
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
    return counts;
  }, [player.items]);

  return (
    <div class="items-inventory">
      {/* Stats Section */}
      <div class="items-stats">
        {DISPLAYED_STATS.map((stat) => (
          <div class="items-stat" key={stat.label}>
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
              <div class="item-entry" key={itemId}>
                <span class="item-emoji">{item.emoji}</span>
                <span class="item-name">{item.name}</span>
                {count > 1 && <span class="item-count">×{count}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
