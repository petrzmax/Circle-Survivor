import { SHOP_ITEMS } from '@/config/shop.config';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { WeaponType } from '@/domain/weapons/type';
import { WeaponManager } from '@/domain/weapons/WeaponManager';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { RenderSystem } from '@/systems/RenderSystem';
import { WaveManager } from '@/systems/WaveManager';
import { EnemyType } from '@/types/enums';
import { singleton } from 'tsyringe';

/**
 * Player state snapshot for DevMenu display
 */
// TODO needed here?
export interface PlayerState {
  hp: number;
  maxHp: number;
  godMode: boolean;
}

@singleton()
export class DevMenuService {
  public constructor(
    private entityManager: EntityManager,
    private waveManager: WaveManager,
    private renderSystem: RenderSystem,
    private weaponManager: WeaponManager,
    private enemySpawnSystem: EnemySpawnSystem,
  ) {}

  // ============ Wave Control ============

  public getCurrentWave(): number {
    return this.waveManager.currentWave;
  }

  public skipToWave(wave: number): void {
    this.waveManager.skipToWave(wave);
    console.log(`[DevMenu] Skipped to wave ${wave}`);
  }

  public finishWave(): void {
    // Emit waveCleared to trigger state transition to SHOP
    EventBus.emit('waveCleared', undefined);
    console.log(`[DevMenu] Finished wave, transitioning to shop`);
  }

  public killAllEnemies(): void {
    this.entityManager.killAllEnemies();
    console.log(`[DevMenu] Killed all enemies`);
  }

  // ============ Player Actions ============

  public getPlayerState(): PlayerState | null {
    try {
      const player = this.entityManager.getPlayer();
      return {
        hp: player.hp,
        maxHp: player.maxHp,
        godMode: player.godMode,
      };
    } catch {
      return null;
    }
  }

  public setGodMode(enabled: boolean): void {
    const player = this.entityManager.getPlayer();
    player.godMode = enabled;
    console.log(`[DevMenu] God mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  public healPlayer(amount: number): void {
    const player = this.entityManager.getPlayer();
    player.heal(amount);
    console.log(`[DevMenu] Player healed`);
  }

  public addItemToPlayer(itemId: string): void {
    const player = this.entityManager.getPlayer();
    const item = SHOP_ITEMS[itemId];

    if (item?.type === 'item') {
      player.addItem(itemId);

      // Apply stat bonuses from effect
      const effect = item.effect;
      for (const [stat, value] of Object.entries(effect)) {
        if (value !== undefined) {
          player.applyStat(stat as keyof typeof effect, value as number);
        }
      }
      console.log(`[DevMenu] Added item: ${item.name}`);
    }
  }

  // ============ Entity Actions ============

  public addWeapon(type: WeaponType): void {
    this.weaponManager.addWeapon(type);
    console.log(`[DevMenu] Added weapon: ${type}`);
  }

  public spawnEnemy(type: EnemyType, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      // TODO why not use spawn batch? so batch would get type and amount
      this.enemySpawnSystem.spawn(type);
    }
    console.log(`[DevMenu] Spawned ${count}x ${type}`);
  }

  public addGold(amount: number): void {
    EventBus.emit('goldCollected', { amount, position: { x: 0, y: 0 } });
    console.log(`[DevMenu] Added ${amount} gold`);
  }

  // ============ Debug Display ============

  public setShowEnemyCount(show: boolean): void {
    this.renderSystem.setShowEnemyCount(show);
  }
}
