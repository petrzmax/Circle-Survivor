import { SHOP_ITEMS } from '@/config/shop.config';
import { EnemySpawnSystem } from '@/domain/enemies/EnemySpawnSystem';
import { WeaponType } from '@/domain/weapons/type';
import { WeaponManager } from '@/domain/weapons/WeaponManager';
import { Health, PlayerStats } from '@/ecs/traits';
import { fullHealEntity } from '@/ecs/utils/entity-utils';
import { addItem, applyStat } from '@/ecs/utils/player-utils';
import { EventBus } from '@/events/EventBus';
import { EntityManager } from '@/managers/EntityManager';
import { RenderSystem } from '@/systems/RenderSystem';
import { WaveManager } from '@/systems/WaveManager';
import { EnemyType, PickupType } from '@/types/enums';
import { singleton } from 'tsyringe';

/**
 * Player state snapshot for DevMenu display
 */
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
    // Skip overlay animation, go directly to shop
    EventBus.emit('waveClearAnimationDone', undefined);
    console.log(`[DevMenu] Finished wave, transitioning to shop`);
  }

  public killAllEnemies(): void {
    this.entityManager.killAllEnemies();
    console.log(`[DevMenu] Killed all enemies`);
  }

  // ============ Player Actions ============

  public getPlayerState(): PlayerState | null {
    if (!this.entityManager.hasPlayer()) return null;
    const entity = this.entityManager.getPlayerEntity();
    const health = entity.get(Health)!;
    const stats = entity.get(PlayerStats)!;
    return {
      hp: health.hp,
      maxHp: health.maxHp,
      godMode: stats.godMode,
    };
  }

  public setGodMode(enabled: boolean): void {
    const stats = this.entityManager.getPlayerStats();
    stats.godMode = enabled;
    console.log(`[DevMenu] God mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  public healPlayer(): void {
    const entity = this.entityManager.getPlayerEntity();
    fullHealEntity(entity);
    console.log(`[DevMenu] Player healed`);
  }

  public addItemToPlayer(itemId: string): void {
    const entity = this.entityManager.getPlayerEntity();
    const item = SHOP_ITEMS[itemId];

    if (item?.type === 'item') {
      addItem(entity, itemId);

      // Apply stat bonuses from effect
      const effect = item.effect;
      for (const [stat, value] of Object.entries(effect)) {
        if (value !== undefined) {
          applyStat(entity, stat as keyof typeof effect, value as number);
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
    this.enemySpawnSystem.spawnBatch(Array.from({ length: count }, () => type));
    console.log(`[DevMenu] Spawned ${count}x ${type}`);
  }

  public addGold(amount: number): void {
    EventBus.emit('pickupCollected', { type: PickupType.GOLD, amount, position: { x: 0, y: 0 } });
    console.log(`[DevMenu] Added ${amount} gold`);
  }

  // ============ Debug Display ============

  public setShowEnemyCount(show: boolean): void {
    this.renderSystem.setShowEnemyCount(show);
  }
}
