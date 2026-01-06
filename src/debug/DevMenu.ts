/**
 * DevMenu - Developer tools panel for testing and debugging.
 * Only available in development mode (import.meta.env.DEV).
 */

import { SHOP_ITEMS } from '@/config/shop.config';
import { WEAPON_TYPES } from '@/config/weapons.config';
import { EventBus } from '@/core/EventBus';
import { ENEMY_TYPES } from '@/domain/enemies/config';
import { EnemyType, WeaponType } from '@/types/enums';
import { getEnemyDisplayName, getSpawnPoint } from '@/utils';
import './devMenuStyles.css';
import devMenuTemplate from './devMenuTemplate.html?raw';

/**
 * DevMenu dependencies - injected callbacks for game actions
 * This decouples DevMenu from Game implementation details
 */
export interface DevMenuDependencies {
  // State
  getState: () => string;
  getCanvasSize: () => { width: number; height: number };

  // Debug display options
  setShowEnemyCount: (show: boolean) => void;

  // Game control
  pauseGame: () => void;
  resumeGame: () => void;

  // Wave control
  getCurrentWave: () => number;
  skipToWave: (wave: number) => void;

  // Player actions
  getPlayer: () => {
    hp: number;
    maxHp: number;
    godMode: boolean;
    setGodMode: (enabled: boolean) => void;
    heal: (amount: number) => void;
    addItem: (itemId: string) => void;
    applyStat: (stat: string, value: number) => void;
  } | null;

  // Entity actions
  addWeapon: (type: WeaponType) => void;
  spawnEnemy: (type: EnemyType, x: number, y: number) => void;
  killAllEnemies: () => void;
}

export class DevMenu {
  private container: HTMLElement | null = null;
  private isVisible: boolean = false;
  private deps: DevMenuDependencies;
  private previousState: string = 'playing';

  // Drag state
  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  public constructor(deps: DevMenuDependencies) {
    this.deps = deps;
    this.init();
  }

  /**
   * Initialize the dev menu - create HTML and add to DOM
   */
  private init(): void {
    this.createHTML();
    this.setupEventListeners();
    this.setupDragListeners();
  }

  /**
   * Create the HTML structure for the dev menu
   */
  private createHTML(): void {
    this.container = document.createElement('div');
    this.container.className = 'dev-menu';
    this.container.innerHTML = devMenuTemplate;

    document.body.appendChild(this.container);
    this.populateDropdowns();
  }

  /**
   * Populate dropdown menus with available options
   */
  private populateDropdowns(): void {
    // Items dropdown - include both 'item' and 'weaponBonus' types
    const itemSelect = document.getElementById('dev-item-select') as HTMLSelectElement;
    itemSelect.innerHTML = '';
    for (const [id, item] of Object.entries(SHOP_ITEMS)) {
      if (item.type === 'item' || item.type === 'weaponBonus') {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${item.emoji || ''} ${item.name}`;
        itemSelect.appendChild(option);
      }
    }

    // Weapons dropdown
    const weaponSelect = document.getElementById('dev-weapon-select') as HTMLSelectElement;
    weaponSelect.innerHTML = '';
    for (const [type, config] of Object.entries(WEAPON_TYPES)) {
      if (type === 'minibanana') continue; // Skip internal type
      const option = document.createElement('option');
      option.value = type;
      option.textContent = `${config.emoji || ''} ${config.name}`;
      weaponSelect.appendChild(option);
    }

    // Boss dropdown
    const bossSelect = document.getElementById('dev-boss-select') as HTMLSelectElement;
    bossSelect.innerHTML = '';
    for (const type of Object.values(EnemyType)) {
      const config = ENEMY_TYPES[type];
      if (config.isBoss) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getEnemyDisplayName(type);
        bossSelect.appendChild(option);
      }
    }

    // Enemy dropdown
    const enemySelect = document.getElementById('dev-enemy-select') as HTMLSelectElement;
    enemySelect.innerHTML = '';
    for (const type of Object.values(EnemyType)) {
      const config = ENEMY_TYPES[type];
      if (!config.isBoss) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getEnemyDisplayName(type);
        enemySelect.appendChild(option);
      }
    }
  }

  /**
   * Setup event listeners for all buttons and inputs
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    // Wave control
    document.getElementById('dev-wave-go')?.addEventListener('click', () => {
      const input = document.getElementById('dev-wave-input') as HTMLInputElement;
      const wave = parseInt(input.value, 10);
      if (wave > 0) {
        this.skipToWave(wave);
      }
    });

    document.getElementById('dev-wave-kill')?.addEventListener('click', () => {
      this.killAllEnemies();
    });

    // Items
    document.getElementById('dev-item-add')?.addEventListener('click', () => {
      const select = document.getElementById('dev-item-select') as HTMLSelectElement;
      if (select.value) {
        this.addItem(select.value);
      }
    });

    document.getElementById('dev-weapon-add')?.addEventListener('click', () => {
      const select = document.getElementById('dev-weapon-select') as HTMLSelectElement;
      if (select.value) {
        this.addWeapon(select.value as WeaponType);
      }
    });

    // Gold button
    document.getElementById('dev-gold-1000')?.addEventListener('click', () => {
      this.addGold(1000);
    });

    // Spawning
    document.getElementById('dev-boss-spawn')?.addEventListener('click', () => {
      const select = document.getElementById('dev-boss-select') as HTMLSelectElement;
      if (select.value) {
        this.spawnEnemy(select.value as EnemyType, 1);
      }
    });

    document.getElementById('dev-enemy-spawn')?.addEventListener('click', () => {
      const select = document.getElementById('dev-enemy-select') as HTMLSelectElement;
      const countInput = document.getElementById('dev-enemy-count') as HTMLInputElement;
      const count = parseInt(countInput.value, 10) || 1;
      if (select.value) {
        this.spawnEnemy(select.value as EnemyType, count);
      }
    });

    // Player cheats
    document.getElementById('dev-godmode')?.addEventListener('change', (e) => {
      const checkbox = e.target as HTMLInputElement;
      this.toggleGodMode(checkbox.checked);
    });

    document.getElementById('dev-fullheal')?.addEventListener('click', () => {
      this.fullHeal();
    });

    // Debug display options
    document.getElementById('dev-show-enemy-count')?.addEventListener('change', (e) => {
      const checkbox = e.target as HTMLInputElement;
      this.deps.setShowEnemyCount(checkbox.checked);
    });

    // Keyboard shortcut (F1)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  // ============ Drag & Drop ============

  /**
   * Setup drag listeners for the header
   */
  private setupDragListeners(): void {
    const header = this.container?.querySelector('.dev-menu-header') as HTMLElement | null;
    if (!header) return;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      this.onDragStart(e);
    });
    document.addEventListener('mousemove', (e) => {
      this.onDragMove(e);
    });
    document.addEventListener('mouseup', () => {
      this.onDragEnd();
    });
  }

  private onDragStart(e: MouseEvent): void {
    if (!this.container) return;

    this.isDragging = true;
    this.container.classList.add('dragging');

    const rect = this.container.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
  }

  private onDragMove(e: MouseEvent): void {
    if (!this.isDragging || !this.container) return;

    e.preventDefault();

    // Calculate new position
    let newX = e.clientX - this.dragOffsetX;
    let newY = e.clientY - this.dragOffsetY;

    // Constrain to viewport
    const rect = this.container.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Apply position
    this.container.style.left = `${newX}px`;
    this.container.style.top = `${newY}px`;
  }

  private onDragEnd(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container?.classList.remove('dragging');
  }

  // ============ Visibility Control ============

  /**
   * Show the dev menu and pause the game
   */
  public show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.container?.classList.add('visible');

    // Store current state and pause if playing
    const currentState = this.deps.getState();
    if (currentState === 'playing') {
      this.previousState = 'playing';
      this.deps.pauseGame();
    } else {
      this.previousState = currentState;
    }

    // Update wave input to current wave
    const waveInput = document.getElementById('dev-wave-input') as HTMLInputElement;
    waveInput.value = String(this.deps.getCurrentWave());

    // Update god mode checkbox
    const godmodeCheckbox = document.getElementById('dev-godmode') as HTMLInputElement;
    const player = this.deps.getPlayer();
    if (player) {
      godmodeCheckbox.checked = player.godMode;
    }
  }

  /**
   * Hide the dev menu and resume the game
   */
  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container?.classList.remove('visible');

    // Resume game if it was playing before
    if (this.previousState === 'playing') {
      this.deps.resumeGame();
    }
  }

  /**
   * Toggle dev menu visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // ============ Actions ============

  /**
   * Skip to a specific wave
   */
  private skipToWave(wave: number): void {
    this.deps.skipToWave(wave);
    console.log(`[DevMenu] Skipped to wave ${wave}`);
  }

  /**
   * Kill all active enemies
   */
  private killAllEnemies(): void {
    this.deps.killAllEnemies();
    console.log(`[DevMenu] Killed all enemies`);
  }

  /**
   * Add an item to the player
   */
  private addItem(itemId: string): void {
    const player = this.deps.getPlayer();
    if (player) {
      const item = SHOP_ITEMS[itemId];
      if (item?.type === 'item') {
        player.addItem(itemId);
        // Apply stat bonuses from effect - iterate all effect properties
        const effect = item.effect;
        for (const [stat, value] of Object.entries(effect)) {
          if (value !== undefined) {
            player.applyStat(stat as keyof typeof effect, value as number);
          }
        }
        console.log(`[DevMenu] Added item: ${item.name}`);
      }
    }
  }

  /**
   * Add a weapon to the player
   */
  private addWeapon(type: WeaponType): void {
    this.deps.addWeapon(type);
    console.log(`[DevMenu] Added weapon: ${type}`);
  }

  /**
   * Add gold to the player
   */
  private addGold(amount: number): void {
    EventBus.emit('goldCollected', { amount, position: { x: 0, y: 0 } });
    console.log(`[DevMenu] Added ${amount} gold`);
  }

  /**
   * Spawn enemies at random positions
   */
  private spawnEnemy(type: EnemyType, count: number): void {
    const canvas = this.deps.getCanvasSize();
    for (let i = 0; i < count; i++) {
      const point = getSpawnPoint(canvas, 30);
      this.deps.spawnEnemy(type, point.x, point.y);
    }
    console.log(`[DevMenu] Spawned ${count}x ${type}`);
  }

  /**
   * Toggle god mode for the player
   */
  private toggleGodMode(enabled: boolean): void {
    const player = this.deps.getPlayer();
    if (player) {
      player.setGodMode(enabled);
      console.log(`[DevMenu] God mode: ${enabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Fully heal the player
   */
  private fullHeal(): void {
    const player = this.deps.getPlayer();
    if (player) {
      player.heal(player.maxHp);
      console.log(`[DevMenu] Player fully healed`);
    }
  }

  /**
   * Destroy the dev menu
   */
  public destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
