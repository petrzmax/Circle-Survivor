import { SHOP_ITEMS } from '@/config/shop.config';
import { Game } from '@/core/Game';
import { WeaponType } from '@/domain/weapons/type';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { WeaponManager } from '@/managers/WeaponManager';
import { RenderSystem } from '@/systems/RenderSystem';
import { WaveManager } from '@/systems/WaveManager';
import { EnemyType } from '@/types/enums';
import { getSpawnPoint } from '@/utils';
import { singleton } from 'tsyringe';
import { ConfigService } from './../core/ConfigService';

/**
 * Player state snapshot for DevMenu display
 */
// TODO needed here?
export interface PlayerState {
  hp: number;
  maxHp: number;
  godMode: boolean;
}

/**
 * Get Game instance from window (set by Game constructor)
 */
// TODO weird asf, remove
function getGame(): Game {
  return (window as unknown as { game: Game }).game;
}

@singleton()
export class DevMenuService {
  public constructor(
    private entityManager: EntityManager,
    private waveManager: WaveManager,
    private renderSystem: RenderSystem,
    private weaponManager: WeaponManager,
    private configService: ConfigService,
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
    getGame().killAllEnemies();
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

  // TODO should be delegated to spawn system when ready
  public spawnEnemy(type: EnemyType, count: number = 1): void {
    const canvas = this.configService.getCanvasBounds();
    const game = getGame();
    for (let i = 0; i < count; i++) {
      const point = getSpawnPoint(canvas, 30);
      game.spawnEnemy(type, point.x, point.y);
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
