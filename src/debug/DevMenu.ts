/**
 * DevMenu - Developer tools panel for testing and debugging.
 * Only available in development mode (import.meta.env.DEV).
 */

import './devMenuStyles.css';
import devMenuTemplate from './devMenuTemplate.html?raw';
import { WeaponType, EnemyType } from '@/types/enums';
import { WEAPON_TYPES } from '@/config/weapons.config';
import { ENEMY_TYPES } from '@/config/enemies.config';
import { SHOP_ITEMS } from '@/config/shop.config';

/**
 * DevMenu dependencies - injected callbacks for game actions
 * This decouples DevMenu from Game implementation details
 */
export interface DevMenuDependencies {
  // State
  getState: () => string;
  getGold: () => number;
  setGold: (value: number) => void;
  getCanvasSize: () => { width: number; height: number };
  
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

  constructor(deps: DevMenuDependencies) {
    this.deps = deps;
    this.init();
  }

  /**
   * Initialize the dev menu - create HTML and add to DOM
   */
  private init(): void {
    this.createHTML();
    this.setupEventListeners();
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
    // Items dropdown
    const itemSelect = document.getElementById('dev-item-select') as HTMLSelectElement;
    if (itemSelect) {
      itemSelect.innerHTML = '<option value="">Select Item...</option>';
      for (const [id, item] of Object.entries(SHOP_ITEMS)) {
        if (item.type === 'item') {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = `${item.emoji || ''} ${item.name}`;
          itemSelect.appendChild(option);
        }
      }
    }

    // Weapons dropdown
    const weaponSelect = document.getElementById('dev-weapon-select') as HTMLSelectElement;
    if (weaponSelect) {
      weaponSelect.innerHTML = '<option value="">Select Weapon...</option>';
      for (const [type, config] of Object.entries(WEAPON_TYPES)) {
        if (type === 'minibanana') continue; // Skip internal type
        const option = document.createElement('option');
        option.value = type;
        option.textContent = `${config.emoji || ''} ${config.name}`;
        weaponSelect.appendChild(option);
      }
    }

    // Boss dropdown - use formatted type name since config.name is generic 'BOSS'
    const bossSelect = document.getElementById('dev-boss-select') as HTMLSelectElement;
    if (bossSelect) {
      bossSelect.innerHTML = '<option value="">Select Boss...</option>';
      const bossLabels: Record<string, string> = {
        boss: '👹 Standard Boss',
        boss_swarm: '🐝 Swarm Boss',
        boss_tank: '🛡️ Tank Boss',
        boss_speed: '⚡ Speed Boss',
        boss_exploder: '💥 Exploder Boss',
        boss_ghost: '👻 Ghost Boss',
      };
      for (const [type, config] of Object.entries(ENEMY_TYPES)) {
        if (config.isBoss) {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = bossLabels[type] || type;
          bossSelect.appendChild(option);
        }
      }
    }

    // Enemy dropdown
    const enemySelect = document.getElementById('dev-enemy-select') as HTMLSelectElement;
    if (enemySelect) {
      enemySelect.innerHTML = '<option value="">Select Enemy...</option>';
      for (const [type, config] of Object.entries(ENEMY_TYPES)) {
        if (!config.isBoss) {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = config.name;
          enemySelect.appendChild(option);
        }
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
    document.getElementById('dev-gold-1000')?.addEventListener('click', () => this.addGold(1000));

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

    // Keyboard shortcut (F1)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.toggle();
      }
    });
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
    if (waveInput) {
      waveInput.value = String(this.deps.getCurrentWave());
    }

    // Update god mode checkbox
    const godmodeCheckbox = document.getElementById('dev-godmode') as HTMLInputElement;
    const player = this.deps.getPlayer();
    if (godmodeCheckbox && player) {
      godmodeCheckbox.checked = player.godMode ?? false;
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
      if (item && item.type === 'item') {
        player.addItem(itemId);
        // Apply stat bonuses from effect - iterate all effect properties
        const effect = item.effect;
        for (const [stat, value] of Object.entries(effect)) {
          if (value !== undefined) {
            player.applyStat(stat as keyof typeof effect, value);
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
    const currentGold = this.deps.getGold();
    this.deps.setGold(currentGold + amount);
    console.log(`[DevMenu] Added ${amount} gold (total: ${currentGold + amount})`);
  }

  /**
   * Spawn enemies at random positions
   */
  private spawnEnemy(type: EnemyType, count: number): void {
    const canvas = this.deps.getCanvasSize();
    for (let i = 0; i < count; i++) {
      // Spawn at random edge position
      const side = Math.floor(Math.random() * 4);
      let x: number, y: number;
      
      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = -30;
          break;
        case 1: // Right
          x = canvas.width + 30;
          y = Math.random() * canvas.height;
          break;
        case 2: // Bottom
          x = Math.random() * canvas.width;
          y = canvas.height + 30;
          break;
        default: // Left
          x = -30;
          y = Math.random() * canvas.height;
      }
      
      this.deps.spawnEnemy(type, x, y);
    }
    console.log(`[DevMenu] Spawned ${count}x ${type}`);
  }

  /**
   * Toggle god mode for the player
   */
  private toggleGodMode(enabled: boolean): void {
    const player = this.deps.getPlayer();
    if (player) {
      player.godMode = enabled;
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
