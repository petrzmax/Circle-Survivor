/**
 * Custom hook for weapon tooltip functionality
 * Encapsulates mouse tracking and tooltip state management
 */

import { WEAPON_TYPES } from '@/domain/weapons/config';
import { WeaponConfig, WeaponType } from '@/domain/weapons/type';
import { useCallback, useState } from 'preact/hooks';

interface WeaponTooltipData {
  config: WeaponConfig;
  level: number;
}

interface UseWeaponTooltipReturn {
  hoveredWeapon: WeaponTooltipData | null;
  mousePosition: { x: number; y: number };
  handleMouseMove: (e: MouseEvent) => void;
  showTooltip: (weaponType: WeaponType, level?: number) => void;
  hideTooltip: () => void;
}

export function useWeaponTooltip(): UseWeaponTooltipReturn {
  const [hoveredWeapon, setHoveredWeapon] = useState<WeaponTooltipData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const showTooltip = useCallback((weaponType: WeaponType, level: number = 1): void => {
    setHoveredWeapon({ config: WEAPON_TYPES[weaponType], level });
  }, []);

  const hideTooltip = useCallback((): void => {
    setHoveredWeapon(null);
  }, []);

  return { hoveredWeapon, mousePosition, handleMouseMove, showTooltip, hideTooltip };
}
