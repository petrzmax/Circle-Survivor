/**
 * Custom hook for item tooltip functionality.
 * Mirrors useWeaponTooltip pattern — manages mouse tracking and tooltip state.
 */

import { SHOP_ITEMS, StatShopItem } from '@/config/shop.config';
import { ViewportScaler } from '@/utils/viewport-scaler';
import { useCallback, useState } from 'preact/hooks';

interface UseItemTooltipReturn {
  hoveredItem: StatShopItem | null;
  mousePosition: { x: number; y: number };
  handleMouseMove: (e: MouseEvent) => void;
  showTooltip: (itemKey: string) => void;
  hideTooltip: () => void;
}

export function useItemTooltip(): UseItemTooltipReturn {
  const [hoveredItem, setHoveredItem] = useState<StatShopItem | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    const local = ViewportScaler.viewportToLocal(e.clientX, e.clientY);
    setMousePosition(local);
  }, []);

  const showTooltip = useCallback((itemKey: string): void => {
    const item = SHOP_ITEMS[itemKey];
    if (item?.type === 'item') {
      setHoveredItem(item);
    }
  }, []);

  const hideTooltip = useCallback((): void => {
    setHoveredItem(null);
  }, []);

  return { hoveredItem, mousePosition, handleMouseMove, showTooltip, hideTooltip };
}
