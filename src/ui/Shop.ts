/**
 * Shop system - handles item effect application
 * UI rendering is handled by Preact Shop component
 */

import { SHOP_ITEMS } from '@/config/shop.config';
import { WeaponType } from '@/types/enums';
import { randomElementStrict } from '@/utils';

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

export interface ShopCallbacks {
  getWaveNumber(): number;
  showNotification(message: string): void;
  updateHUD(): void;
}

// ============ Shop Class ============

export class Shop {
  private callbacks: ShopCallbacks | null = null;

  /**
   * Set callbacks for game integration
   */
  public setCallbacks(callbacks: ShopCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Apply item effect to player.
   * Called externally when Preact Shop component emits purchase events.
   * No price check or event emission - those are handled by caller.
   */
  public applyItemEffect(itemId: string, player: ShopPlayer): void {
    if (!this.callbacks) return;

    const item = SHOP_ITEMS[itemId];
    if (!item) return;

    switch (item.type) {
      case 'weapon': {
        const weaponItem = item;
        if (player.weapons.length >= player.maxWeapons) {
          const sameTypeWeapons = player.weapons.filter((w) => w.type === weaponItem.weaponType);
          if (sameTypeWeapons.length > 0) {
            const randomWeapon = randomElementStrict(sameTypeWeapons);
            randomWeapon.upgrade();
            this.callbacks.showNotification(`⬆️ ${item.name} +${randomWeapon.level}`);
          }
        } else {
          player.addWeapon(weaponItem.weaponType);
        }
        break;
      }

      case 'item': {
        const statItem = item;
        player.addItem(itemId);
        for (const [stat, valueRaw] of Object.entries(statItem.effect)) {
          const value = valueRaw as number;
          if (stat === 'maxHp') {
            player.maxHp += value;
            player.hp += value;
          } else if (player[stat] !== undefined) {
            (player[stat] as number) += value;
          }
        }
        break;
      }
    }
  }
}
