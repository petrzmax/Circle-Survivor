import { SHOP_ITEMS } from '@/config/shop.config';
import { ENEMY_TYPES } from '@/domain/enemies/config';
import { WEAPON_TYPES } from '@/domain/weapons/config';
import { EnemyType, WeaponType } from '@/types/enums';
import { getEnemyDisplayName } from '@/utils';
import { JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import { DevMenuService } from './DevMenuService';
import './devMenuStyles.css';

// ============ Dropdown Data Helpers ============

interface SelectOption {
  value: string;
  label: string;
}

function getAvailableItems(): SelectOption[] {
  return Object.entries(SHOP_ITEMS)
    .filter(([, item]) => item.type === 'item')
    .map(([id, item]) => ({
      value: id,
      label: `${item.emoji || ''} ${item.name}`,
    }));
}

function getAvailableWeapons(): SelectOption[] {
  return Object.entries(WEAPON_TYPES)
    .filter(([type]) => type !== 'minibanana')
    .map(([type, config]) => ({
      value: type,
      label: `${config.emoji || ''} ${config.name}`,
    }));
}

function getAvailableBosses(): SelectOption[] {
  return Object.values(EnemyType)
    .filter((type) => ENEMY_TYPES[type].isBoss)
    .map((type) => ({
      value: type,
      label: getEnemyDisplayName(type),
    }));
}

function getAvailableEnemies(): SelectOption[] {
  return Object.values(EnemyType)
    .filter((type) => !ENEMY_TYPES[type].isBoss)
    .map((type) => ({
      value: type,
      label: getEnemyDisplayName(type),
    }));
}

// ============ Section Component ============

interface DevMenuSectionProps {
  title: string;
  children: JSX.Element | JSX.Element[];
}

function DevMenuSection({ title, children }: DevMenuSectionProps): JSX.Element {
  return (
    <div className="dev-menu-section">
      <div className="dev-menu-section-title">{title}</div>
      {children}
    </div>
  );
}

// ============ Main DevMenu Component ============

export function DevMenu(): JSX.Element | null {
  // Service - resolve from DI container
  const service = useMemo(() => container.resolve(DevMenuService), []);

  // Visibility state
  const [isVisible, setIsVisible] = useState(false);

  // Form state
  const [waveInput, setWaveInput] = useState('1');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedBoss, setSelectedBoss] = useState('');
  const [selectedEnemy, setSelectedEnemy] = useState('');
  const [enemyCount, setEnemyCount] = useState('1');
  const [godMode, setGodMode] = useState(false);
  const [showEnemyCount, setShowEnemyCount] = useState(false);

  // Dropdown options (memoized)
  const items = useMemo(() => getAvailableItems(), []);
  const weapons = useMemo(() => getAvailableWeapons(), []);
  const bosses = useMemo(() => getAvailableBosses(), []);
  const enemies = useMemo(() => getAvailableEnemies(), []);

  // Set default selections when options load
  useEffect(() => {
    if (items.length > 0 && !selectedItem) setSelectedItem(items[0]!.value);
    if (weapons.length > 0 && !selectedWeapon) setSelectedWeapon(weapons[0]!.value);
    if (bosses.length > 0 && !selectedBoss) setSelectedBoss(bosses[0]!.value);
    if (enemies.length > 0 && !selectedEnemy) setSelectedEnemy(enemies[0]!.value);
  }, [items, weapons, bosses, enemies, selectedItem, selectedWeapon, selectedBoss, selectedEnemy]);

  // F1 keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync form state when menu opens
  useEffect(() => {
    if (isVisible) {
      // Update current wave in input
      setWaveInput(String(service.getCurrentWave()));
      // Update god mode checkbox
      const playerState = service.getPlayerState();
      if (playerState) {
        setGodMode(playerState.godMode);
      }
    }
  }, [isVisible, service]);

  // ============ Action Handlers ============

  const handleSkipToWave = (): void => {
    const wave = parseInt(waveInput, 10);
    if (wave > 0) {
      service.skipToWave(wave);
    }
  };

  const handleAddItem = (): void => {
    if (selectedItem) {
      service.addItemToPlayer(selectedItem);
    }
  };

  const handleAddWeapon = (): void => {
    if (selectedWeapon) {
      service.addWeapon(selectedWeapon as WeaponType);
    }
  };

  const handleSpawnBoss = (): void => {
    if (selectedBoss) {
      service.spawnEnemy(selectedBoss as EnemyType, 1);
    }
  };

  const handleSpawnEnemy = (): void => {
    if (selectedEnemy) {
      const count = parseInt(enemyCount, 10) || 1;
      service.spawnEnemy(selectedEnemy as EnemyType, count);
    }
  };

  const handleGodModeChange = (e: Event): void => {
    const enabled = (e.target as HTMLInputElement).checked;
    setGodMode(enabled);
    service.setGodMode(enabled);
  };

  const handleShowEnemyCountChange = (e: Event): void => {
    const show = (e.target as HTMLInputElement).checked;
    setShowEnemyCount(show);
    service.setShowEnemyCount(show);
  };

  // ============ Render ============

  if (!isVisible) return null;

  return (
    <div className="dev-menu visible">
      <div className="dev-menu-header">
        <span>🔧 DEV MENU</span>
        <span className="dev-menu-hint">F1</span>
      </div>

      <div className="dev-menu-content">
        {/* Wave Control */}
        <DevMenuSection title="Wave Control">
          <div className="dev-menu-row">
            <span className="dev-menu-label">Wave:</span>
            <input
              type="number"
              min="1"
              value={waveInput}
              onChange={(e) => {
                setWaveInput((e.target as HTMLInputElement).value);
              }}
            />
            <button type="button" onClick={handleSkipToWave}>
              Go
            </button>
            <button type="button" className="danger" onClick={() => {
              service.killAllEnemies();
            }}>
              Kill All
            </button>
            <button type="button" className="success" onClick={() => {
              service.finishWave();
            }}>
              Finish
            </button>
          </div>
        </DevMenuSection>

        {/* Items */}
        <DevMenuSection title="Items">
          <div className="dev-menu-row">
            <select value={selectedItem} onChange={(e) => {
              setSelectedItem((e.target as HTMLSelectElement).value);
            }}>
              {items.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddItem}>
              Add
            </button>
          </div>
          <div className="dev-menu-row">
            <select value={selectedWeapon} onChange={(e) => {
              setSelectedWeapon((e.target as HTMLSelectElement).value);
            }}>
              {weapons.map((weapon) => (
                <option key={weapon.value} value={weapon.value}>
                  {weapon.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddWeapon}>
              Add
            </button>
          </div>
          <div className="dev-menu-row">
            <span className="dev-menu-label">Gold:</span>
            <button type="button" onClick={() => {
              service.addGold(1000);
            }}>
              +1000
            </button>
          </div>
        </DevMenuSection>

        {/* Spawning */}
        <DevMenuSection title="Spawn">
          <div className="dev-menu-row">
            <select value={selectedBoss} onChange={(e) => {
              setSelectedBoss((e.target as HTMLSelectElement).value);
            }}>
              {bosses.map((boss) => (
                <option key={boss.value} value={boss.value}>
                  {boss.label}
                </option>
              ))}
            </select>
            <button type="button" className="danger" onClick={handleSpawnBoss}>
              Spawn
            </button>
          </div>
          <div className="dev-menu-row">
            <select value={selectedEnemy} onChange={(e) => {
              setSelectedEnemy((e.target as HTMLSelectElement).value);
            }}>
              {enemies.map((enemy) => (
                <option key={enemy.value} value={enemy.value}>
                  {enemy.label}
                </option>
              ))}
            </select>
            <span className="dev-menu-x">x</span>
            <input
              type="number"
              min="1"
              max="50"
              value={enemyCount}
              onChange={(e) => {
                setEnemyCount((e.target as HTMLInputElement).value);
              }}
            />
            <button type="button" onClick={handleSpawnEnemy}>
              Spawn
            </button>
          </div>
        </DevMenuSection>

        {/* Player */}
        <DevMenuSection title="Player">
          <div className="dev-menu-row">
            <div className="dev-menu-checkbox">
              <input type="checkbox" id="dev-godmode" checked={godMode} onChange={handleGodModeChange} />
              <label htmlFor="dev-godmode">God Mode</label>
            </div>
            <button type="button" className="success" onClick={() => {
              service.healPlayer(Infinity);
            }}>
              Full Heal
            </button>
          </div>
        </DevMenuSection>

        {/* Debug Display */}
        <DevMenuSection title="Display">
          <div className="dev-menu-row">
            <div className="dev-menu-checkbox">
              <input
                type="checkbox"
                id="dev-show-enemy-count"
                checked={showEnemyCount}
                onChange={handleShowEnemyCountChange}
              />
              <label htmlFor="dev-show-enemy-count">Enemy Count</label>
            </div>
          </div>
        </DevMenuSection>

        <div className="dev-menu-info">Press F1 to toggle</div>
      </div>
    </div>
  );
}
