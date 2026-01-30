/**
 * Shop system - handles item effect application
 * UI rendering is handled by Preact Shop component
 */

import { GAME_BALANCE } from '@/config';
import { SHOP_ITEMS, WeaponShopItem } from '@/config/shop.config';
import { Player } from '@/domain/player/Player';
import { PlayerStats } from '@/domain/player/type';
import { WeaponType } from '@/domain/weapons/type';
import { WeaponManager } from '@/domain/weapons/WeaponManager';
import { randomElementStrict } from '@/utils';
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
  addWeapon(type: string): void;
  addItem(itemKey: string): void;
  applyStat(stat: string, value: number): void;
  heal(amount: number): void;
  [stat: string]: unknown;
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
   * Apply item effect to player.
   * Called externally when Preact Shop component emits purchase events.
   * No price check or event emission - those are handled by caller.
   */
  public applyItemEffect(itemId: string, player: Player): void {
    const item = SHOP_ITEMS[itemId];
    if (!item) return;

    switch (item.type) {
      case 'weapon': {
        const weaponItem = item;
        if (player.weapons.length >= player.maxWeapons) {
          const sameTypeWeapons = player.weapons.filter((w) => w.type === weaponItem.weaponType);
          if (sameTypeWeapons.length > 0) {
            const randomWeapon = randomElementStrict(sameTypeWeapons);
            this.weaponManager.upgradeWeapon(randomWeapon);
            toast(`⬆️ ${item.name} +${randomWeapon.level}`);
          }
        } else {
          this.weaponManager.addWeapon(weaponItem.weaponType);
        }
        break;
      }

      case 'item': {
        const statItem = item;
        player.addItem(itemId);
        for (const [stat, valueRaw] of Object.entries(statItem.effect)) {
          const value = valueRaw as number;
          player.applyStat(stat as keyof PlayerStats, value);
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
