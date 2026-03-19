/**
 * WeaponInventory component - displays player's weapons with sell functionality
 */

import { SHOP_ITEMS, WeaponShopItem } from '@/config/shop.config';
import { WeaponType } from '@/domain/weapons/type';
import { JSX } from 'preact';
import { useWeaponTooltip } from '../../hooks/useWeaponTooltip';
import { WeaponTooltip } from '../WeaponTooltip';
import styles from './WeaponInventory.module.scss';

interface WeaponData {
  type: WeaponType;
  name: string;
  level: number;
  index: number;
}

interface WeaponInventoryProps {
  weapons: WeaponData[];
  onSell: (weaponIndex: number, sellPrice: number) => void;
  onMerge: (weaponIndex: number) => void;
  canMerge: (weaponIndex: number) => boolean;
  getSellPrice: (weaponType: WeaponType, level: number) => number;
  maxLevel: number;
}

/**
 * Get emoji for a weapon type from shop config
 */
function getWeaponEmoji(weaponType: WeaponType): string {
  const shopItem = Object.values(SHOP_ITEMS).find(
    (item) => item.type === 'weapon' && item.weaponType === weaponType,
  ) as WeaponShopItem | undefined;

  return shopItem?.emoji ?? '🔫';
}

export function WeaponInventory({
  weapons,
  onSell,
  onMerge,
  canMerge,
  getSellPrice,
  maxLevel,
}: WeaponInventoryProps): JSX.Element {
  const tooltip = useWeaponTooltip();

  if (weapons.length === 0) {
    return (
      <div class={styles.inventory}>
        <div class={styles.empty}>Brak broni w ekwipunku</div>
      </div>
    );
  }

  return (
    <div class={styles.inventory} onMouseMove={tooltip.handleMouseMove}>
      {weapons.map((weapon) => {
        const sellPrice = getSellPrice(weapon.type, weapon.level);
        const emoji = getWeaponEmoji(weapon.type);

        return (
          <div
            class={styles.card}
            key={weapon.index}
            onMouseEnter={(): void => {
              tooltip.showTooltip(weapon.type, weapon.level);
            }}
            onMouseLeave={tooltip.hideTooltip}
          >
            <div class={styles.emoji}>{emoji}</div>
            <h4>{weapon.name}</h4>
            <div class={styles.level}>Poziom {weapon.level}</div>
            {weapon.level >= maxLevel ? (
              <button class={styles.mergeBtn} disabled>
                ✨ Max poziom
              </button>
            ) : (
              <button
                class={styles.mergeBtn}
                disabled={!canMerge(weapon.index)}
                onClick={(): void => {
                  onMerge(weapon.index);
                }}
              >
                ⚡ Połącz
              </button>
            )}
            <button
              class={styles.sellBtn}
              onClick={(): void => {
                onSell(weapon.index, sellPrice);
              }}
            >
              💰 Sprzedaj ({sellPrice})
            </button>
          </div>
        );
      })}

      <WeaponTooltip weaponData={tooltip.hoveredWeapon} position={tooltip.mousePosition} />
    </div>
  );
}
