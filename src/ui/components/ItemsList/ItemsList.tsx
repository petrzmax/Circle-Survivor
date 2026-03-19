import { SHOP_ITEMS } from '@/config/shop.config';
import { JSX } from 'preact';
import { useItemTooltip } from '../../hooks/useItemTooltip';
import styles from './ItemsList.module.scss';

interface ItemsListProps {
  groupedItems: Map<string, number>;
  itemTooltip: ReturnType<typeof useItemTooltip>;
}

export function ItemsList({ groupedItems, itemTooltip }: ItemsListProps): JSX.Element {
  return (
    <>
      <div class={styles.sectionLabel}>📦 Przedmioty</div>
      {groupedItems.size === 0 ? (
        <div class={styles.empty}>Brak przedmiotów</div>
      ) : (
        <div class={styles.list}>
          {Array.from(groupedItems.entries()).map(([itemId, count]) => {
            const item = SHOP_ITEMS[itemId];
            if (!item || item.type === 'weapon') return null;
            return (
              <div
                class={styles.entry}
                key={itemId}
                onMouseEnter={(): void => {
                  itemTooltip.showTooltip(itemId);
                }}
                onMouseLeave={itemTooltip.hideTooltip}
              >
                <span class={styles.emoji}>{item.emoji}</span>
                <span class={styles.name}>{item.name}</span>
                {count > 1 && <span class={styles.count}>×{count}</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
