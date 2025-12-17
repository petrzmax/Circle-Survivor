/**
 * Shop system
 * Generates items, renders shop UI, handles purchases
 * Matches original js/shop.js exactly.
 */

import { SHOP_ITEMS, WeaponShopItem, StatShopItem, WeaponBonusShopItem } from '@/config/shop.config';
import { GAME_BALANCE } from '@/config/balance.config';

// ============ Types ============

export interface ShopPlayer {
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
  type: string;
  name: string;
  level: number;
  upgrade(): void;
  [bonusType: string]: unknown;
}

export interface ShopCallbacks {
  getGold(): number;
  setGold(value: number): void;
  getWaveNumber(): number;
  playPurchaseSound(): void;
  playErrorSound(): void;
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
  setCallbacks(callbacks: ShopCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Calculate reroll price
   */
  getRerollPrice(): number {
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;
    const basePrice = GAME_BALANCE.economy.reroll.baseCost;
    // Price = base * (1 + wave*perWave) * (1 + reroll*perReroll)
    const waveMultiplier = 1 + (waveNumber - 1) * GAME_BALANCE.economy.reroll.perWave;
    const rerollMultiplier = 1 + this.rerollCount * GAME_BALANCE.economy.reroll.perReroll;
    return Math.round((basePrice * waveMultiplier * rerollMultiplier) / 5) * 5;
  }

  /**
   * Reroll items in shop
   */
  rerollItems(player: ShopPlayer): void {
    if (!this.callbacks) return;

    const price = this.getRerollPrice();

    if (this.callbacks.getGold() < price) {
      this.callbacks.playErrorSound();
      return;
    }

    this.callbacks.setGold(this.callbacks.getGold() - price);
    this.rerollCount++;

    this.callbacks.playPurchaseSound();

    // Generate new items
    this.generateItems(player);
    this.renderShop(this.callbacks.getGold(), player);
    this.callbacks.updateHUD();
  }

  /**
   * Dynamic price scaling
   */
  calculatePrice(basePrice: number, player: ShopPlayer): number {
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;

    // Scaling with wave number (after startWave, +perWave% per wave)
    let waveMultiplier = 1;
    if (waveNumber > GAME_BALANCE.economy.priceScale.startWave) {
      waveMultiplier = 1 + (waveNumber - GAME_BALANCE.economy.priceScale.startWave) * GAME_BALANCE.economy.priceScale.perWave;
    }

    // Scaling with owned items (+perItem% per item)
    const itemCount = player.items ? player.items.length : 0;
    const itemMultiplier = 1 + itemCount * GAME_BALANCE.economy.priceScale.perItem;

    // Scaling with weapon count (+perWeapon% per weapon)
    const weaponCount = player.weapons ? player.weapons.length : 0;
    const weaponMultiplier = 1 + weaponCount * GAME_BALANCE.economy.priceScale.perWeapon;

    // Final price (rounded to 5)
    const finalPrice = basePrice * waveMultiplier * itemMultiplier * weaponMultiplier;
    return Math.round(finalPrice / 5) * 5;
  }

  /**
   * Generate items for shop
   */
  generateItems(player: ShopPlayer): void {
    // Item categorization
    const weapons: string[] = [];
    const items: string[] = [];

    Object.keys(SHOP_ITEMS).forEach((key) => {
      const item = SHOP_ITEMS[key];
      if (!item) return;

      // Don't offer weapon bonus if no weapons
      if (item.type === 'weaponBonus' && player.weapons.length === 0) return;

      if (item.type === 'weapon') weapons.push(key);
      else if (item.type === 'item' || item.type === 'weaponBonus') items.push(key);
    });

    // Shuffle each category
    const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);
    shuffle(weapons);
    shuffle(items);

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
    if (weapons.length > weaponCount && weapons[weaponCount]) extras.push(weapons[weaponCount]!);
    if (items.length > itemCountInShop && items[itemCountInShop]) extras.push(items[itemCountInShop]!);
    shuffle(extras);
    if (extras.length > 0 && extras[0]) {
      this.availableItems.push(extras[0]);
    }

    // Shuffle final list
    shuffle(this.availableItems);
  }

  /**
   * Reset reroll on shop open
   */
  resetReroll(): void {
    this.rerollCount = 0;
  }

  /**
   * Render shop UI
   */
  renderShop(gold: number, player: ShopPlayer): void {
    const shopEl = document.getElementById('shop');
    const itemsEl = document.getElementById('shop-items');

    if (!itemsEl || !shopEl) return;

    itemsEl.innerHTML = '';

    // Show info about wave, weapons, items and gold in one line
    const waveNumber = this.callbacks?.getWaveNumber() ?? 1;
    const infoEl = document.createElement('div');
    infoEl.className = 'shop-info';
    infoEl.innerHTML = `<small>Fala ${waveNumber} | Bronie: ${player.weapons.length}/${player.maxWeapons} | Przedmioty: ${player.items ? player.items.length : 0} | <span style="color: #ffd700">💰 ${gold}</span></small>`;
    itemsEl.appendChild(infoEl);

    this.availableItems.forEach((itemKey) => {
      const item = SHOP_ITEMS[itemKey];
      if (!item) return;

      const currentPrice = this.calculatePrice(item.price, player);
      const canAfford = gold >= currentPrice;

      // Check if weapon is locked (full slots and don't have this weapon)
      let isWeaponLocked = false;
      if (item.type === 'weapon') {
        const weaponItem = item as WeaponShopItem;
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
        const weaponItem = item as WeaponShopItem;
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
        itemEl.onclick = () => this.buyItem(itemKey, player, currentPrice);
      }

      itemsEl.appendChild(itemEl);
    });

    // Reroll button
    const rerollPrice = this.getRerollPrice();
    const canReroll = gold >= rerollPrice;

    const rerollEl = document.createElement('div');
    rerollEl.className = `shop-item reroll-btn ${canReroll ? '' : 'disabled'}`;
    rerollEl.innerHTML = `
            <div style="font-size: 24px">🎲</div>
            <h3>Losuj</h3>
            <p>Nowe przedmioty</p>
            <div class="price">💰 ${rerollPrice}</div>
        `;

    if (canReroll) {
      rerollEl.onclick = () => this.rerollItems(player);
    }

    itemsEl.appendChild(rerollEl);

    shopEl.classList.remove('hidden');
  }

  /**
   * Buy item from shop
   */
  buyItem(itemKey: string, player: ShopPlayer, currentPrice: number | null = null): void {
    if (!this.callbacks) return;

    const item = SHOP_ITEMS[itemKey];
    if (!item) return;

    const price = currentPrice ?? this.calculatePrice(item.price, player);

    if (this.callbacks.getGold() < price) {
      this.callbacks.playErrorSound();
      return;
    }

    this.callbacks.setGold(this.callbacks.getGold() - price);
    this.callbacks.playPurchaseSound();

    switch (item.type) {
      case 'weapon': {
        const weaponItem = item as WeaponShopItem;
        // Check if player has full slots
        if (player.weapons.length >= player.maxWeapons) {
          // Upgrade random weapon of the same type
          const sameTypeWeapons = player.weapons.filter((w) => w.type === weaponItem.weaponType);
          if (sameTypeWeapons.length > 0) {
            // Pick random weapon of this type
            const randomWeapon = sameTypeWeapons[Math.floor(Math.random() * sameTypeWeapons.length)];
            if (randomWeapon) {
              randomWeapon.upgrade();
              // Show upgrade notification
              this.callbacks.showNotification(`⬆️ ${item.name} +${randomWeapon.level}`);
            }
          } else {
            // No weapon of this type - refund (shouldn't happen)
            this.callbacks.setGold(this.callbacks.getGold() + price);
            this.callbacks.playErrorSound();
            return;
          }
        } else {
          // Add new weapon
          player.addWeapon(weaponItem.weaponType);
        }
        break;
      }

      case 'weaponBonus': {
        const bonusItem = item as WeaponBonusShopItem;
        // Bonus to random weapon (e.g., multishot)
        if (player.weapons.length === 0) {
          this.callbacks.setGold(this.callbacks.getGold() + price);
          this.callbacks.playErrorSound();
          return;
        }
        // Add item to inventory
        player.addItem(itemKey);
        // Pick random weapon
        const randomWeaponForBonus = player.weapons[Math.floor(Math.random() * player.weapons.length)];
        if (randomWeaponForBonus) {
          // Apply bonus to weapon
          if (bonusItem.bonusType && randomWeaponForBonus[bonusItem.bonusType] !== undefined) {
            (randomWeaponForBonus[bonusItem.bonusType] as number) += bonusItem.bonusValue;
          }
          // Show notification
          this.callbacks.showNotification(`🎯 ${randomWeaponForBonus.name} +${bonusItem.bonusValue} pocisk!`);
        }
        break;
      }

      case 'item': {
        const statItem = item as StatShopItem;
        // Add item to inventory
        player.addItem(itemKey);
        // Apply effects
        if (statItem.effect) {
          for (const [stat, value] of Object.entries(statItem.effect)) {
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
    this.renderShop(this.callbacks.getGold(), player);
    this.callbacks.updateHUD();
  }

  /**
   * Hide shop UI
   */
  hideShop(): void {
    const shopEl = document.getElementById('shop');
    if (shopEl) shopEl.classList.add('hidden');
  }
}
