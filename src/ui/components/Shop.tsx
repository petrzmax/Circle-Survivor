import { GAME_BALANCE } from '@/config/balance.config';
import { SHOP_ITEMS, ShopItem } from '@/config/shop.config';
import { WeaponType } from '@/domain/weapons/type';
import { EventBus } from '@/events/EventBus';
import { Shop as ShopService } from '@/systems/Shop';
import { calculatePrice, generateShopItems, getRerollPrice } from '@/systems/ShopLogic';
import { JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import { usePlayer } from '../hooks/usePlayer';
import { useWave } from '../hooks/useWave';
import { useItemTooltip } from '../hooks/useItemTooltip';
import { useWeaponTooltip } from '../hooks/useWeaponTooltip';
import { ItemsInventory } from './ItemsInventory';
import { ItemTooltip } from './ItemTooltip';
import { WeaponInventory } from './WeaponInventory';
import { WeaponTooltip } from './WeaponTooltip';

const shopService = container.resolve(ShopService);

type ShopTab = 'buy' | 'inventory' | 'items';

interface ShopProps {
  visible: boolean;
}

export function Shop({ visible }: ShopProps): JSX.Element | null {
  const player = usePlayer();
  const { waveNumber } = useWave();
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [soldItems, setSoldItems] = useState<Set<string>>(new Set());
  const [rerollCount, setRerollCount] = useState(0);
  const [shopInitialized, setShopInitialized] = useState(false);
  const [pendingReroll, setPendingReroll] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('buy');
  const tooltip = useWeaponTooltip();
  const itemTooltip = useItemTooltip();

  const gold = player?.gold ?? 0;
  const weapons = player?.weapons ?? [];
  const maxWeapons = player?.maxWeapons ?? 6;
  const items = player?.items ?? [];

  // Generate items only when shop first opens (visible changes from false to true)
  useEffect(() => {
    if (visible && !shopInitialized) {
      setRerollCount(0);
      setSoldItems(new Set());
      setActiveTab('buy');
      setAvailableItems(generateShopItems(gold, waveNumber));
      setShopInitialized(true);
    } else if (!visible && shopInitialized) {
      // Reset when shop closes — clear items to prevent stale items flashing on next open
      setAvailableItems([]);
      setShopInitialized(false);
    }
  }, [visible, shopInitialized]);

  const currentCalculatePrice = useCallback(
    (basePrice: number): number => calculatePrice(basePrice, waveNumber),
    [waveNumber],
  );

  const currentRerollPrice = getRerollPrice(waveNumber, rerollCount);

  const handleBuy = (itemKey: string, price: number): void => {
    if (gold < price) {
      EventBus.emit('shopError', undefined);
      return;
    }

    setSoldItems((prev) => new Set([...prev, itemKey]));
    EventBus.emit('itemPurchased', { itemId: itemKey, cost: price });
  };

  const handleReroll = (): void => {
    const price = currentRerollPrice;
    if (gold < price) {
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
      setAvailableItems(generateShopItems(gold, waveNumber));
      setPendingReroll(false);
    }
  }, [gold, pendingReroll]);

  const handleStartWave = (): void => {
    EventBus.emit('startGameRequested', undefined);
  };

  const handleSellWeapon = (weaponIndex: number, sellPrice: number): void => {
    EventBus.emit('weaponSold', { weaponIndex, sellPrice });
  };

  const handleMergeWeapon = (weaponIndex: number): void => {
    EventBus.emit('weaponMerge', { weaponIndex });
  };

  const canMergeWeapon = useCallback(
    (weaponIndex: number): boolean => {
      const weapon = weapons[weaponIndex];
      if (!weapon) return false;

      if (weapon.level >= GAME_BALANCE.weapons.maxLevel) return false;

      return weapons.some(
        (w, i) => i !== weaponIndex && w.type === weapon.type && w.level === weapon.level,
      );
    },
    [weapons],
  );

  const getSellPrice = useCallback(
    (weaponType: WeaponType, level: number): number =>
      shopService.calculateSellPrice(weaponType, waveNumber, level),
    [waveNumber],
  );

  if (!visible) return null;

  const rerollPrice = currentRerollPrice;

  // Prepare weapons with index for inventory
  const weaponsWithIndex = weapons.map((w, index) => ({
    ...w,
    index,
  }));

  return (
    <div
      id="shop"
      onMouseMove={(e: MouseEvent): void => {
        tooltip.handleMouseMove(e);
        itemTooltip.handleMouseMove(e);
      }}
    >
      <h2>🛒 SKLEP</h2>

      {/* Tab Navigation */}
      <div class="shop-tabs">
        <button
          class={`shop-tab ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={(): void => {
            setActiveTab('buy');
            tooltip.hideTooltip();
            itemTooltip.hideTooltip();
          }}
        >
          🛍️ Kup
        </button>
        <button
          class={`shop-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={(): void => {
            setActiveTab('inventory');
            tooltip.hideTooltip();
            itemTooltip.hideTooltip();
          }}
        >
          ⚔️ Ekwipunek
        </button>
        <button
          class={`shop-tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={(): void => {
            setActiveTab('items');
            tooltip.hideTooltip();
            itemTooltip.hideTooltip();
          }}
        >
          📦 Przedmioty
        </button>
      </div>

      {/* Info bar - always visible */}
      <div class="shop-info">
        <small>
          Fala {waveNumber} | Bronie: {weapons.length}/{maxWeapons} | Przedmioty: {items.length} |{' '}
          <span style={{ color: '#ffd700' }}>💰 {gold}</span>
        </small>
        <button
          class={`reroll-inline-btn ${gold < rerollPrice ? 'disabled' : ''}`}
          onClick={gold >= rerollPrice ? handleReroll : undefined}
          disabled={gold < rerollPrice || activeTab !== 'buy'}
          style={activeTab !== 'buy' ? { opacity: 0, pointerEvents: 'none' } : undefined}
        >
          🎲 Losuj (💰 {rerollPrice})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'buy' && (
        <div id="shop-items">
          {availableItems
            .filter((itemKey) => !soldItems.has(itemKey) && SHOP_ITEMS[itemKey])
            .map((itemKey, index) => {
              const item = SHOP_ITEMS[itemKey]!;
              const currentPrice = currentCalculatePrice(item.price);
              const canAfford = gold >= currentPrice;

              let isWeaponLocked = false;
              let upgradeInfo = '';

              if (item.type === 'weapon') {
                const hasThisWeapon = weapons.some((w) => w.type === item.weaponType);
                if (weapons.length >= maxWeapons) {
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
                  onMouseEnter={(): void => {
                    if (item.type === 'weapon') {
                      // Only show upgraded level if this is actually an upgrade
                      // (player has max weapons AND already owns this weapon type)
                      const existingWeapon = weapons.find((w) => w.type === item.weaponType);
                      const isUpgrade = weapons.length >= maxWeapons && existingWeapon;
                      const level = isUpgrade ? existingWeapon.level + 1 : 1;
                      tooltip.showTooltip(item.weaponType, level);
                    } else {
                      itemTooltip.showTooltip(itemKey);
                    }
                  }}
                  onMouseLeave={(): void => {
                    tooltip.hideTooltip();
                    itemTooltip.hideTooltip();
                  }}
                />
              );
            })}
        </div>
      )}

      {activeTab === 'inventory' && (
        <WeaponInventory
          weapons={weaponsWithIndex}
          onSell={handleSellWeapon}
          onMerge={handleMergeWeapon}
          canMerge={canMergeWeapon}
          getSellPrice={getSellPrice}
          maxLevel={GAME_BALANCE.weapons.maxLevel}
        />
      )}

      {activeTab === 'items' && player && <ItemsInventory player={player} />}

      <button id="start-wave-btn" onClick={handleStartWave}>
        ▶ Rozpocznij falę
      </button>

      <WeaponTooltip weaponData={tooltip.hoveredWeapon} position={tooltip.mousePosition} />
      <ItemTooltip itemData={itemTooltip.hoveredItem} position={itemTooltip.mousePosition} />
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function ShopItemCard({
  item,
  price,
  canBuy,
  isLocked,
  upgradeInfo,
  onBuy,
  onMouseEnter,
  onMouseLeave,
}: ShopItemCardProps): JSX.Element {
  return (
    <div
      class={`shop-item ${canBuy ? '' : 'disabled'}`}
      onClick={canBuy ? onBuy : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{ fontSize: '24px' }}>{item.emoji}</div>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      {isLocked && <div style={{ color: '#ff6b6b', fontSize: '10px' }}>🔒 Pełne sloty</div>}
      {upgradeInfo && <div style={{ color: '#4ecdc4', fontSize: '10px' }}>{upgradeInfo}</div>}
      <div class="price">💰 {price}</div>
    </div>
  );
}
