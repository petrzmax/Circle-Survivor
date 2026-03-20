/**
 * Shop system - handles item effect application
 * UI rendering is handled by Preact Shop component
 */

import { GAME_BALANCE } from '@/config';
import { SHOP_ITEMS, WeaponShopItem } from '@/config/shop.config';
import { PlayerStats as PlayerStatsType } from '@/domain/player/type';
import { WeaponType } from '@/domain/weapons/type';
import { PlayerStats, WeaponInventory } from '@/ecs/traits';
import { addItem, applyStat } from '@/ecs/utils/player-utils';
import { WeaponManager } from '@/domain/weapons/WeaponManager';
import type { Entity } from 'koota';
import toast from 'react-hot-toast';
import { singleton } from 'tsyringe';

// ============ Types ============

export interface ShopPlayer {
  gold: number;
  weapons: ShopWeapon[];
  maxWeapons: number;
  items?: string[];
  maxHp: number;
  hp: number;
}

export interface ShopWeapon {
  type: WeaponType;
  name: string;
  level: number;
  upgrade(): void;
  [bonusType: string]: unknown;
}

// ============ Shop Class ============

@singleton()
export class Shop {
  public constructor(private weaponManager: WeaponManager) {}

  /**
   * Apply item effect to player entity.
   * Called externally when Preact Shop component emits purchase events.
   */
  public applyItemEffect(itemId: string, playerEntity: Entity): void {
    const item = SHOP_ITEMS[itemId];
    if (!item) return;

    switch (item.type) {
      case 'weapon': {
        const weaponItem = item;
        const inv = playerEntity.get(WeaponInventory)!;
        const stats = playerEntity.get(PlayerStats)!;
        const shopLevel = weaponItem.level ?? 1;

        if (inv.weapons.length >= stats.maxWeapons) {
          const upgraded = this.weaponManager.mergeWithShopWeapon(weaponItem.weaponType, shopLevel);
          if (upgraded) {
            toast(`⬆️ ${item.name} +${upgraded.level}`);
          }
        } else {
          this.weaponManager.addWeapon(weaponItem.weaponType, shopLevel);
        }
        break;
      }

      case 'item': {
        const statItem = item;
        addItem(playerEntity, itemId);
        for (const [stat, valueRaw] of Object.entries(statItem.effect)) {
          const value = valueRaw as number;
          applyStat(playerEntity, stat as keyof PlayerStatsType, value);
        }
        break;
      }
    }
  }

  /**
   * Calculate sell price for a weapon based on its type, level, and current wave
   * @param weaponType The type of weapon to sell
   * @param waveNumber Current wave number (affects price scaling)
   * @param level Weapon level (higher level = higher sell price)
   * @returns Sell price in gold (30% of buy price, scaled by wave and level)
   */
  public calculateSellPrice(weaponType: WeaponType, waveNumber: number, level: number = 1): number {
    const shopItem = Object.values(SHOP_ITEMS).find(
      (item) => item.type === 'weapon' && item.weaponType === weaponType,
    ) as WeaponShopItem | undefined;

    if (!shopItem) return 0;

    const basePrice = shopItem.price;
    const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.priceScale.perWave;
    const levelMultiplier = 1 + (level - 1) * GAME_BALANCE.economy.sell.levelMultiplier;
    const scaledPrice = basePrice * waveMultiplier * levelMultiplier;

    return Math.round(scaledPrice * GAME_BALANCE.economy.sell.priceMultiplier);
  }
}
