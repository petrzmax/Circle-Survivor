import { GAME_BALANCE } from '@/config/balance.config';
import { SHOP_ITEMS, ShopItem } from '@/config/shop.config';
import { EventBus } from '@/core/EventBus';
import { WeaponType } from '@/types/enums';
import { shuffleArray } from '@/utils';
import { JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

interface PlayerState {
  gold: number;
  weapons: Array<{ type: WeaponType; name: string; level: number }>;
  maxWeapons: number;
  items?: string[];
}

interface ShopProps {
  visible: boolean;
  playerState: PlayerState;
  waveNumber: number;
}

export function Shop({ visible, playerState, waveNumber }: ShopProps): JSX.Element | null {
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [soldItems, setSoldItems] = useState<Set<string>>(new Set());
  const [rerollCount, setRerollCount] = useState(0);
  const [shopInitialized, setShopInitialized] = useState(false);
  const [pendingReroll, setPendingReroll] = useState(false);

  // Generate items only when shop first opens (visible changes from false to true)
  useEffect(() => {
    if (visible && !shopInitialized) {
      setRerollCount(0);
      setSoldItems(new Set());
      generateItemsWithGold(playerState.gold);
      setShopInitialized(true);
    } else if (!visible && shopInitialized) {
      // Reset when shop closes
      setShopInitialized(false);
    }
  }, [visible, shopInitialized]);

  const calculatePrice = useCallback(
    (basePrice: number): number => {
      const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.priceScale.perWave;
      return Math.round(basePrice * waveMultiplier);
    },
    [waveNumber],
  );

  const getRerollPrice = useCallback((): number => {
    const basePrice = GAME_BALANCE.economy.reroll.baseCost;
    const waveMultiplier = 1 + (waveNumber - 2) * GAME_BALANCE.economy.reroll.perWave;
    const rerollMultiplier = 1 + rerollCount * GAME_BALANCE.economy.reroll.perReroll;
    return Math.round(basePrice * waveMultiplier * rerollMultiplier);
  }, [waveNumber, rerollCount]);

  const generateItemsWithGold = useCallback(
    (gold: number): void => {
      const affordableWeapons: string[] = [];
      const unaffordableWeapons: string[] = [];
      const affordableItems: string[] = [];
      const unaffordableItems: string[] = [];

      Object.keys(SHOP_ITEMS).forEach((key) => {
        const item = SHOP_ITEMS[key];
        if (!item) return;

        const price = calculatePrice(item.price);
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
      setAvailableItems(newItems);
    },
    [calculatePrice],
  );

  const handleBuy = (itemKey: string, price: number): void => {
    if (playerState.gold < price) {
      EventBus.emit('shopError', undefined);
      return;
    }

    setSoldItems((prev) => new Set([...prev, itemKey]));
    EventBus.emit('itemPurchased', { itemId: itemKey, cost: price });
  };

  const handleReroll = (): void => {
    const price = getRerollPrice();
    if (playerState.gold < price) {
      EventBus.emit('shopError', undefined);
      return;
    }
    setRerollCount((c) => c + 1);
    setSoldItems(new Set());
    setPendingReroll(true);
    EventBus.emit('itemPurchased', { itemId: 'reroll', cost: price });
  };

  // Regenerate items after reroll when gold updates
  useEffect(() => {
    if (visible && shopInitialized && pendingReroll) {
      generateItemsWithGold(playerState.gold);
      setPendingReroll(false);
    }
  }, [playerState.gold, pendingReroll]);

  const handleStartWave = (): void => {
    EventBus.emit('startGameRequested', undefined);
  };

  if (!visible) return null;

  const rerollPrice = getRerollPrice();

  return (
    <div id="shop">
      <h2>🛒 SKLEP</h2>
      <p>Wybierz ulepszenie przed kolejną falą!</p>

      <div id="shop-items">
        {/* Info bar */}
        <div class="shop-info">
          <small>
            Fala {waveNumber} | Bronie: {playerState.weapons.length}/{playerState.maxWeapons} |
            Przedmioty: {playerState.items?.length ?? 0} |{' '}
            <span style={{ color: '#ffd700' }}>💰 {playerState.gold}</span>
          </small>
          <button
            class={`reroll-inline-btn ${playerState.gold < rerollPrice ? 'disabled' : ''}`}
            onClick={playerState.gold >= rerollPrice ? handleReroll : undefined}
            disabled={playerState.gold < rerollPrice}
          >
            🎲 Losuj (💰 {rerollPrice})
          </button>
        </div>

        {/* Items - filter out sold items before mapping to avoid DOM diffing issues */}
        {availableItems
          .filter((itemKey) => !soldItems.has(itemKey) && SHOP_ITEMS[itemKey])
          .map((itemKey, index) => {
            const item = SHOP_ITEMS[itemKey]!;
            const currentPrice = calculatePrice(item.price);
            const canAfford = playerState.gold >= currentPrice;

            // Check weapon lock
            let isWeaponLocked = false;
            let upgradeInfo = '';

            if (item.type === 'weapon') {
              const hasThisWeapon = playerState.weapons.some(
                (w) => w.type === item.weaponType,
              );
              if (playerState.weapons.length >= playerState.maxWeapons) {
                if (!hasThisWeapon) {
                  isWeaponLocked = true;
                } else {
                  upgradeInfo = '⬆️ Upgrade';
                }
              }
            }

            const canBuy = canAfford && !isWeaponLocked;

            return (
              <ShopItemCard
                key={`${itemKey}-${index}`}
                item={item}
                price={currentPrice}
                canBuy={canBuy}
                isLocked={isWeaponLocked}
                upgradeInfo={upgradeInfo}
                onBuy={(): void => {
                  handleBuy(itemKey, currentPrice);
                }}
              />
            );
          })}
      </div>

      <button id="start-wave-btn" onClick={handleStartWave}>
        ▶ Rozpocznij falę
      </button>
    </div>
  );
}

interface ShopItemCardProps {
  item: ShopItem;
  price: number;
  canBuy: boolean;
  isLocked: boolean;
  upgradeInfo: string;
  onBuy: () => void;
}

function ShopItemCard({
  item,
  price,
  canBuy,
  isLocked,
  upgradeInfo,
  onBuy,
}: ShopItemCardProps): JSX.Element {
  return (
    <div class={`shop-item ${canBuy ? '' : 'disabled'}`} onClick={canBuy ? onBuy : undefined}>
      <div style={{ fontSize: '24px' }}>{item.emoji}</div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      {isLocked && <div style={{ color: '#ff6b6b', fontSize: '10px' }}>🔒 Pełne sloty</div>}
      {upgradeInfo && <div style={{ color: '#4ecdc4', fontSize: '10px' }}>{upgradeInfo}</div>}
      <div class="price">💰 {price}</div>
    </div>
  );
}
