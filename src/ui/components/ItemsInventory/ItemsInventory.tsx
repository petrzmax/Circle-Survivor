import type { PlayerData } from '@/domain/player/type';
import { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { useItemTooltip } from '../../hooks/useItemTooltip';
import { ItemTooltip } from '../ItemTooltip';
import { ItemsList } from '../ItemsList';
import { StatsColumn } from '../StatsColumn';
import layout from '../shared/items-layout.module.scss';

interface ItemsInventoryProps {
  player: PlayerData;
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
    <div class={layout.inventory} onMouseMove={itemTooltip.handleMouseMove}>
      {/* Left Column - Items */}
      <div class={layout.columnLeft}>
        <ItemsList groupedItems={groupedItems} itemTooltip={itemTooltip} />
      </div>

      {/* Right Column - Stats */}
      <StatsColumn stats={player} />

      <ItemTooltip itemData={itemTooltip.hoveredItem} position={itemTooltip.mousePosition} />
    </div>
  );
}
