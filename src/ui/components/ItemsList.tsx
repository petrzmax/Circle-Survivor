import { SHOP_ITEMS } from '@/config/shop.config';
import { JSX } from 'preact';
import { useItemTooltip } from '../hooks/useItemTooltip';

interface ItemsListProps {
  groupedItems: Map<string, number>;
  itemTooltip: ReturnType<typeof useItemTooltip>;
}

export function ItemsList({ groupedItems, itemTooltip }: ItemsListProps): JSX.Element {
  return (
    <>
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
    </>
  );
}
