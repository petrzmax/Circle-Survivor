/**
 * ShopLogic - Pure functions for shop calculations.
 * Extracted from Shop.tsx for testability and separation of concerns.
 */

import { GAME_BALANCE } from '@/config/balance.config';
import { SHOP_ITEMS } from '@/config/shop.config';
import { shuffleArray } from '@/utils';

/**
 * Calculate wave-scaled price for a shop item.
 */
export function calculatePrice(basePrice: number, waveNumber: number): number {
  const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.priceScale.perWave;
  return Math.round(basePrice * waveMultiplier);
}

/**
 * Calculate the reroll price based on wave and number of rerolls.
 */
export function getRerollPrice(waveNumber: number, rerollCount: number): number {
  const basePrice = GAME_BALANCE.economy.reroll.baseCost;
  const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.reroll.perWave;
  const rerollMultiplier = 1 + rerollCount * GAME_BALANCE.economy.reroll.perReroll;
  return Math.round(basePrice * waveMultiplier * rerollMultiplier);
}

/**
 * Generate shop item selection prioritizing affordable items.
 * Returns array of item keys (2 weapons + 2 items + 2 extras).
 */
export function generateShopItems(gold: number, waveNumber: number): string[] {
  const affordableWeapons: string[] = [];
  const unaffordableWeapons: string[] = [];
  const affordableItems: string[] = [];
  const unaffordableItems: string[] = [];

  Object.keys(SHOP_ITEMS).forEach((key) => {
    const item = SHOP_ITEMS[key];
    if (!item) return;

    const price = calculatePrice(item.price, waveNumber);
    const canAfford = gold >= price;

    if (item.type === 'weapon') {
      if (canAfford) affordableWeapons.push(key);
      else unaffordableWeapons.push(key);
    } else {
      if (canAfford) affordableItems.push(key);
      else unaffordableItems.push(key);
    }
  });

  shuffleArray(affordableWeapons);
  shuffleArray(unaffordableWeapons);
  shuffleArray(affordableItems);
  shuffleArray(unaffordableItems);

  const newItems: string[] = [];

  // 2 weapons - prioritize affordable
  const allWeapons = [...affordableWeapons, ...unaffordableWeapons];
  for (let i = 0; i < 2 && i < allWeapons.length; i++) {
    const key = allWeapons[i];
    if (key) newItems.push(key);
  }

  // 2 items - prioritize affordable
  const allItems = [...affordableItems, ...unaffordableItems];
  for (let i = 0; i < 2 && i < allItems.length; i++) {
    const key = allItems[i];
    if (key) newItems.push(key);
  }

  // 2 extra random - prioritize affordable
  const usedWeapons = allWeapons.slice(0, 2);
  const usedItems = allItems.slice(0, 2);
  const extraWeapons = allWeapons.filter((w) => !usedWeapons.includes(w));
  const extraItems = allItems.filter((i) => !usedItems.includes(i));
  const extras = [...extraWeapons, ...extraItems];
  shuffleArray(extras);

  for (let i = 0; i < 2 && i < extras.length; i++) {
    const key = extras[i];
    if (key) newItems.push(key);
  }

  shuffleArray(newItems);
  return newItems;
}

/**
 * Check if a purchase can be made.
 */
export function canAffordItem(gold: number, price: number): boolean {
  return gold >= price;
}
