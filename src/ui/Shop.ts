/**
 * Shop system
 * Generates items, renders shop UI, handles purchases
 */

import { GAME_BALANCE } from '@/config/balance.config';
import { SHOP_ITEMS } from '@/config/shop.config';
import { EventBus } from '@/core/EventBus';
import { WeaponType } from '@/types';
import { randomElementStrict, shuffleArray } from '@/utils';

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
  private availableItems: string[] = [];
  private rerollCount: number = 0;
  private callbacks: ShopCallbacks | null = null;

  /**
   * Set callbacks for game integration
   */
  public setCallbacks(callbacks: ShopCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Calculate reroll price
   */
  private getRerollPrice(): number {
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;
    const basePrice = GAME_BALANCE.economy.reroll.baseCost;
    // Price = base * (1 + wave*perWave) * (1 + reroll*perReroll)
    const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.reroll.perWave;
    const rerollMultiplier = 1 + this.rerollCount * GAME_BALANCE.economy.reroll.perReroll;
    return Math.round(basePrice * waveMultiplier * rerollMultiplier);
  }

  /**
   * Reroll items in shop
   */
  public rerollItems(player: ShopPlayer): void {
    if (!this.callbacks) return;

    const price = this.getRerollPrice();

    if (player.gold < price) {
      EventBus.emit('shopError', undefined);
      return;
    }
    this.rerollCount++;

    EventBus.emit('itemPurchased', { itemId: 'reroll', cost: price });

    // Generate new items
    this.generateItems(player);
    this.renderShop(player);
    this.callbacks.updateHUD();
  }

  /**
   * Dynamic price scaling
   */
  private calculatePrice(basePrice: number): number {
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;

    // Scaling with wave number (+perWave% per wave)
    const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.priceScale.perWave;

    // Final price
    const finalPrice = basePrice * waveMultiplier;
    return Math.round(finalPrice);
  }

  /**
   * Generate items for shop
   */
  public generateItems(player: ShopPlayer): void {
    // Item categorization
    const weapons: string[] = [];
    const items: string[] = [];

    Object.keys(SHOP_ITEMS).forEach((key) => {
      const item = SHOP_ITEMS[key];
      if (!item) return;
      if (player.gold < item.price) return; // Skip too expensive items
      if (item.type === 'weaponBonus' && player.weapons.length === 0)
        // Don't offer weapon bonus if no weapons
        return;

      if (item.type === 'weapon') weapons.push(key);
      else if (item.type === 'item' || item.type === 'weaponBonus') items.push(key);
    });

    // Shuffle each category
    shuffleArray(weapons);
    shuffleArray(items);

    // Build shop with guaranteed variety
    this.availableItems = [];

    // Guaranteed 2 weapons (or as many as available)
    const weaponCount = Math.min(2, weapons.length);
    for (let i = 0; i < weaponCount; i++) {
      const key = weapons[i];
      if (key) this.availableItems.push(key);
    }

    // Guaranteed 2 items
    const itemCountInShop = Math.min(2, items.length);
    for (let i = 0; i < itemCountInShop; i++) {
      const key = items[i];
      if (key) this.availableItems.push(key);
    }

    // 1 random from: additional item/weapon
    const extras: string[] = [];
    if (weapons.length > weaponCount && weapons[weaponCount]) extras.push(weapons[weaponCount]);
    if (items.length > itemCountInShop && items[itemCountInShop])
      extras.push(items[itemCountInShop]);
    shuffleArray(extras);
    if (extras.length > 0 && extras[0]) {
      this.availableItems.push(extras[0]);
    }

    // Shuffle final list
    shuffleArray(this.availableItems);
  }

  /**
   * Reset reroll on shop open
   */
  public resetReroll(): void {
    this.rerollCount = 0;
  }

  /**
   * Render shop UI
   */
  public renderShop(player: ShopPlayer): void {
    const shopEl = document.getElementById('shop');
    const itemsEl = document.getElementById('shop-items');

    if (!itemsEl || !shopEl) return;

    itemsEl.innerHTML = '';

    // Show info about wave, weapons, items and gold in one line
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;
    const infoEl = document.createElement('div');
    infoEl.className = 'shop-info';
    infoEl.innerHTML = `<small>Fala ${waveNumber} | Bronie: ${player.weapons.length}/${player.maxWeapons} | Przedmioty: ${player.items ? player.items.length : 0} | <span style="color: #ffd700">💰 ${player.gold}</span></small>`;
    itemsEl.appendChild(infoEl);

    this.availableItems.forEach((itemKey) => {
      const item = SHOP_ITEMS[itemKey];
      if (!item) return;

      const currentPrice = this.calculatePrice(item.price);
      const canAfford = player.gold >= currentPrice;

      // Check if weapon is locked (full slots and don't have this weapon)
      let isWeaponLocked = false;
      if (item.type === 'weapon') {
        const weaponItem = item;
        const hasThisWeapon = player.weapons.some((w) => w.type === weaponItem.weaponType);
        if (player.weapons.length >= player.maxWeapons && !hasThisWeapon) {
          isWeaponLocked = true;
        }
      }

      const canBuy = canAfford && !isWeaponLocked;

      const itemEl = document.createElement('div');
      itemEl.className = `shop-item ${canBuy ? '' : 'disabled'}`;

      // Show lock info
      let extraInfo = '';
      if (isWeaponLocked) {
        extraInfo = '<div style="color: #ff6b6b; font-size: 10px">🔒 Pełne sloty</div>';
      } else if (item.type === 'weapon') {
        const weaponItem = item;
        if (
          player.weapons.length >= player.maxWeapons &&
          player.weapons.some((w) => w.type === weaponItem.weaponType)
        ) {
          // Upgrade only when you have full slots AND already have this weapon
          extraInfo = '<div style="color: #4ecdc4; font-size: 10px">⬆️ Upgrade</div>';
        }
      }

      itemEl.innerHTML = `
                <div style="font-size: 24px">${item.emoji}</div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                ${extraInfo}
                <div class="price">💰 ${currentPrice}</div>
            `;

      if (canBuy) {
        itemEl.onclick = () => {
          this.buyItem(itemKey, player, currentPrice);
        };
      }

      itemsEl.appendChild(itemEl);
    });

    // Reroll button
    const rerollPrice = this.getRerollPrice();
    const canReroll = player.gold >= rerollPrice;

    const rerollEl = document.createElement('div');
    rerollEl.className = `shop-item reroll-btn ${canReroll ? '' : 'disabled'}`;
    rerollEl.innerHTML = `
            <div style="font-size: 24px">🎲</div>
            <h3>Losuj</h3>
            <p>Nowe przedmioty</p>
            <div class="price">💰 ${rerollPrice}</div>
        `;

    if (canReroll) {
      rerollEl.onclick = () => {
        this.rerollItems(player);
      };
    }

    itemsEl.appendChild(rerollEl);

    shopEl.classList.remove('hidden');
  }

  /**
   * Buy item from shop
   */
  private buyItem(itemKey: string, player: ShopPlayer, currentPrice: number | null = null): void {
    if (!this.callbacks) return;

    const item = SHOP_ITEMS[itemKey];
    if (!item) return;

    const price = currentPrice ?? this.calculatePrice(item.price);

    if (player.gold < price) {
      EventBus.emit('shopError', undefined);
      return;
    }

    EventBus.emit('itemPurchased', { itemId: itemKey, cost: price });

    switch (item.type) {
      case 'weapon': {
        const weaponItem = item;
        // Check if player has full slots
        if (player.weapons.length >= player.maxWeapons) {
          // Upgrade random weapon of the same type
          const sameTypeWeapons = player.weapons.filter((w) => w.type === weaponItem.weaponType);
          if (sameTypeWeapons.length > 0) {
            // Pick random weapon of this type
            const randomWeapon = randomElementStrict(sameTypeWeapons);
            randomWeapon.upgrade();
            // TODO does it work?
            // Show upgrade notification
            this.callbacks.showNotification(`⬆️ ${item.name} +${randomWeapon.level}`);
          } else {
            // No weapon of this type - refund (shouldn't happen)
            EventBus.emit('shopError', undefined);
            throw new Error('No weapon of this type to upgrade');
          }
        } else {
          // Add new weapon
          player.addWeapon(weaponItem.weaponType);
        }
        break;
      }

      case 'weaponBonus': {
        const bonusItem = item;
        // Bonus to random weapon (e.g., multishot)
        if (player.weapons.length === 0) {
          EventBus.emit('shopError', undefined);
          throw new Error('No weapons to apply bonus to');
        }
        // Add item to inventory
        player.addItem(itemKey);
        // Pick random weapon
        const randomWeaponForBonus = randomElementStrict(player.weapons);
        // Apply bonus to weapon
        if (bonusItem.bonusType && randomWeaponForBonus[bonusItem.bonusType] !== undefined) {
          (randomWeaponForBonus[bonusItem.bonusType] as number) += bonusItem.bonusValue;
        }
        // Show notification
        this.callbacks.showNotification(
          `🎯 ${randomWeaponForBonus.name} +${bonusItem.bonusValue} pocisk!`,
        );

        break;
      }

      case 'item': {
        const statItem = item;
        // Add item to inventory
        player.addItem(itemKey);
        // Apply effects
        if (statItem.effect) {
          for (const [stat, valueRaw] of Object.entries(statItem.effect)) {
            const value = valueRaw as number;
            if (stat === 'maxHp') {
              player.maxHp += value;
              player.hp += value; // Also heal
            } else if (player[stat] !== undefined) {
              (player[stat] as number) += value;
            }
          }
        }
        break;
      }
    }

    // Remove bought item and regenerate
    this.availableItems = this.availableItems.filter((k) => k !== itemKey);
    this.renderShop(player);
    this.callbacks.updateHUD();
  }

  /**
   * Hide shop UI
   */
  public hideShop(): void {
    const shopEl = document.getElementById('shop');
    if (shopEl) shopEl.classList.add('hidden');
  }
}
