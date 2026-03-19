import { CHARACTER_TYPES } from '@/config/characters.config';
import { SHOP_ITEMS, type WeaponShopItem } from '@/config/shop.config';
import { WeaponType } from '@/domain/weapons/type';
import { CharacterType } from '@/types/enums';
import type { LeaderboardEntry } from '@/ui/Leaderboard';
import { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { useItemTooltip } from '../hooks/useItemTooltip';
import { useWeaponTooltip } from '../hooks/useWeaponTooltip';
import { ItemTooltip } from './ItemTooltip';
import { ItemsList } from './ItemsList';
import { StatsColumn } from './StatsColumn';
import { WeaponTooltip } from './WeaponTooltip';

interface LoadoutDetailViewProps {
  entry: LeaderboardEntry;
  onClose: () => void;
}

function getWeaponDisplayData(weaponType: string): { name: string; emoji: string } | null {
  const shopItem = Object.values(SHOP_ITEMS).find(
    (item) => item.type === 'weapon' && item.weaponType === (weaponType as WeaponType),
  ) as WeaponShopItem | undefined;

  if (!shopItem) return null;
  return { name: shopItem.name, emoji: shopItem.emoji };
}

function getCharacterDisplay(character: CharacterType): { emoji: string; name: string } {
  const config = CHARACTER_TYPES[character];
  return { emoji: config.emoji, name: config.name };
}

export function LoadoutDetailView({ entry, onClose }: LoadoutDetailViewProps): JSX.Element {
  const hasLoadout = entry.weapons ?? entry.items ?? entry.playerStats;
  const itemTooltip = useItemTooltip();
  const weaponTooltip = useWeaponTooltip();

  const handleMouseMove = (e: MouseEvent): void => {
    itemTooltip.handleMouseMove(e);
    weaponTooltip.handleMouseMove(e);
  };

  const groupedItems = useMemo(() => {
    if (!entry.items) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const itemId of entry.items) {
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
    return counts;
  }, [entry.items]);

  return (
    <div class="loadout-detail-overlay">
      <div class="loadout-detail-container">
        {/* Header */}
        <div class="loadout-detail-header">
          <h2>
            {getCharacterDisplay(entry.character).emoji} {entry.name}
          </h2>
          <div class="loadout-detail-score">
            {getCharacterDisplay(entry.character).name} | Fala {entry.wave} | {entry.xp} XP |{' '}
            {new Date(entry.date).toLocaleDateString()}
          </div>
        </div>

        {!hasLoadout ? (
          <div class="loadout-detail-empty">
            <p>📦 Brak danych o ekwipunku</p>
            <p class="loadout-detail-empty-hint">
              Dane o ekwipunku są zapisywane od najnowszej wersji gry
            </p>
          </div>
        ) : (
          /* Reuse .items-inventory two-column layout from shop */
          <div class="items-inventory loadout-inventory" onMouseMove={handleMouseMove}>
            {/* Left Column — Weapons + Items */}
            <div class="items-column-left">
              {/* Weapons */}
              <div class="items-section-label">⚔️ Bronie</div>
              {!entry.weapons || entry.weapons.length === 0 ? (
                <div class="items-empty">Brak broni</div>
              ) : (
                <div class="items-list">
                  {entry.weapons.map((weapon, index) => {
                    const display = getWeaponDisplayData(weapon.type);
                    if (!display) return null;
                    return (
                      <div
                        class="item-entry"
                        key={`${weapon.type}-${index}`}
                        onMouseEnter={(): void => {
                          weaponTooltip.showTooltip(weapon.type as WeaponType, weapon.level);
                        }}
                        onMouseLeave={weaponTooltip.hideTooltip}
                      >
                        <span class="item-emoji">{display.emoji}</span>
                        <span class="item-name">{display.name}</span>
                        {weapon.level > 1 && <span class="item-count">Lv.{weapon.level}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Items */}
              <ItemsList groupedItems={groupedItems} itemTooltip={itemTooltip} />
            </div>

            {/* Right Column — Stats */}
            {entry.playerStats && <StatsColumn stats={entry.playerStats} />}
            <ItemTooltip itemData={itemTooltip.hoveredItem} position={itemTooltip.mousePosition} />
            <WeaponTooltip
              weaponData={weaponTooltip.hoveredWeapon}
              position={weaponTooltip.mousePosition}
            />
          </div>
        )}

        <button class="loadout-detail-close" onClick={onClose}>
          ⬅ Powrót
        </button>
      </div>
    </div>
  );
}
