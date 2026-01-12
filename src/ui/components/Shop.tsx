import { JSX } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { EventBus } from '@/core/EventBus';
import { GAME_BALANCE } from '@/config/balance.config';
import { SHOP_ITEMS, ShopItem } from '@/config/shop.config';
import { shuffleArray } from '@/utils';

interface PlayerState {
  gold: number;
  weapons: Array<{ type: string; name: string; level: number }>;
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
      const weapons: string[] = [];
      const items: string[] = [];

      Object.keys(SHOP_ITEMS).forEach((key) => {
        const item = SHOP_ITEMS[key];
        if (!item) return;
        if (gold < item.price) return;

        if (item.type === 'weapon') weapons.push(key);
        else items.push(key);
      });

      shuffleArray(weapons);
      shuffleArray(items);

      const newItems: string[] = [];

      // 2 weapons
      const weaponCount = Math.min(2, weapons.length);
      for (let i = 0; i < weaponCount; i++) {
        const key = weapons[i];
        if (key) newItems.push(key);
      }

      // 2 items
      const itemCount = Math.min(2, items.length);
      for (let i = 0; i < itemCount; i++) {
        const key = items[i];
        if (key) newItems.push(key);
      }

      // 1 extra random
      const extras: string[] = [];
      if (weapons.length > weaponCount && weapons[weaponCount]) extras.push(weapons[weaponCount]);
      if (items.length > itemCount && items[itemCount]) extras.push(items[itemCount]);
      shuffleArray(extras);
      if (extras[0]) newItems.push(extras[0]);

      shuffleArray(newItems);
      setAvailableItems(newItems);
    },
    [playerState.weapons.length],
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
            Fala {waveNumber} | Bronie: {playerState.weapons.length}/{playerState.maxWeapons} | Przedmioty:{' '}
            {playerState.items?.length ?? 0} | <span style={{ color: '#ffd700' }}>💰 {playerState.gold}</span>
          </small>
        </div>

        {/* Items */}
        {availableItems.map((itemKey) => {
          const item = SHOP_ITEMS[itemKey];
          if (!item) return null;

          // Hide sold items
          if (soldItems.has(itemKey)) {
            return null;
          }

          const currentPrice = calculatePrice(item.price);
          const canAfford = playerState.gold >= currentPrice;

          // Check weapon lock
          let isWeaponLocked = false;
          let upgradeInfo = '';

          if (item.type === 'weapon') {
            const hasThisWeapon = playerState.weapons.some(
              (w) => w.type === (item.weaponType as string),
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
              key={itemKey}
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

        {/* Reroll button */}
        <div
          class={`shop-item reroll-btn ${playerState.gold < rerollPrice ? 'disabled' : ''}`}
          onClick={playerState.gold >= rerollPrice ? handleReroll : undefined}
        >
          <div style={{ fontSize: '24px' }}>🎲</div>
          <h3>Losuj</h3>
          <p>Nowe przedmioty</p>
          <div class="price">💰 {rerollPrice}</div>
        </div>
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
