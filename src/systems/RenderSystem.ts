import { GAME_BALANCE } from '@/config/balance.config';
import {
  Collider,
  DeployableData,
  EnemyData,
  Health,
  IsArmed,
  IsAttracted,
  IsBoss,
  Lifetime,
  PickupData,
  PlayerCharacter,
  PlayerStats,
  Position,
  ProjectileData,
  ShockwaveData,
  Velocity,
  WeaponInventory,
} from '@/ecs/traits';
import { getWeaponPosition } from '@/ecs/utils/player-utils';
import { EntityManager } from '@/managers';
import { TimeManager } from '@/managers/TimeManager';
import {
  renderDeployable,
  renderPickup,
  renderPlayer,
  renderProjectile,
  renderWeapons,
} from '@/rendering';
import { renderBackground } from '@/rendering/BackgroundRenderer';
import { renderEnemy } from '@/rendering/EnemyRenderer';
import { renderShockwave } from '@/rendering/ShockwaveRenderer';
import type { BossRenderData, WeaponRenderData } from '@/rendering/render-types';
import { EffectsSystem } from '@/systems/EffectsSystem';
import { singleton } from 'tsyringe';
import { HUD } from './HUD';

@singleton()
export class RenderSystem {
  private entityManager: EntityManager;

  // Debug display flags
  private showEnemyCount: boolean = false;

  public constructor(
    entityManager: EntityManager,
    private effectsSystem: EffectsSystem,
    private timeManager: TimeManager,
  ) {
    this.entityManager = entityManager;
  }

  /**
   * Set whether to show enemy count on canvas (dev tool)
   */
  public setShowEnemyCount(show: boolean): void {
    this.showEnemyCount = show;
  }

  public renderAll(ctx: CanvasRenderingContext2D): void {
    const currentTime = this.timeManager.getElapsed();
    renderBackground(ctx);
    this.renderPickups(ctx);
    this.renderDeployables(ctx, currentTime);
    this.renderProjectiles(ctx);
    this.renderShockwaves(ctx);
    // TODO refactor to decouple from effects system.
    this.effectsSystem.renderAll(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx, currentTime);
    this.renderBossHealthBar(ctx);

    // Debug overlays
    if (this.showEnemyCount) {
      HUD.renderEnemyCount(ctx, this.entityManager.getActiveEnemyCount(), ctx.canvas.height);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const playerEntity = this.entityManager.getPlayerEntity();
    const pos = playerEntity.get(Position)!;
    const char = playerEntity.get(PlayerCharacter)!;
    const stats = playerEntity.get(PlayerStats)!;
    const inv = playerEntity.get(WeaponInventory)!;

    renderPlayer(
      ctx,
      {
        x: pos.x,
        y: pos.y,
        width: char.width,
        height: char.height,
        color: char.color,
        armor: stats.armor,
        invincibleUntil: stats.invincibleUntil,
      },
      currentTime,
    );

    // Pre-compute weapon positions and build render data
    const weaponData: WeaponRenderData[] = inv.weapons.map((weapon, index) => {
      const wPos = getWeaponPosition(playerEntity, index, stats.currentTarget);
      return { x: wPos.x, y: wPos.y, angle: wPos.angle, type: weapon.type, level: weapon.level };
    });
    renderWeapons(ctx, weaponData);
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const entity of this.entityManager.getActiveEnemies()) {
      const pos = entity.get(Position)!;
      const col = entity.get(Collider)!;
      const h = entity.get(Health)!;
      const enemyData = entity.get(EnemyData)!;
      const isBoss = entity.has(IsBoss);

      renderEnemy(ctx, {
        x: pos.x,
        y: pos.y,
        radius: col.radius,
        color: enemyData.color,
        hp: h.hp,
        maxHp: h.maxHp,
        isBoss,
        phasing: enemyData.phasing,
        explodeOnDeath: enemyData.explodeOnDeath,
        hasTopHealthBar: enemyData.hasTopHealthBar,
        bossName: enemyData.bossName,
      });
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const entity of this.entityManager.getActiveProjectiles()) {
      const pos = entity.get(Position)!;
      const col = entity.get(Collider)!;
      const vel = entity.get(Velocity)!;
      const projectileData = entity.get(ProjectileData)!;

      renderProjectile(ctx, {
        x: pos.x,
        y: pos.y,
        radius: col.radius,
        type: projectileData.type,
        color: projectileData.color,
        isCrit: projectileData.isCrit,
        rotation: projectileData.rotation,
        vx: vel.vx,
        vy: vel.vy,
        distanceTraveled: projectileData.distanceTraveled,
        maxDistance: projectileData.maxDistance,
      });
    }
  }

  private renderShockwaves(ctx: CanvasRenderingContext2D): void {
    for (const entity of this.entityManager.getActiveShockwaves()) {
      const pos = entity.get(Position)!;
      const sd = entity.get(ShockwaveData)!;
      if (sd.alpha <= 0) continue;

      renderShockwave(ctx, {
        x: pos.x,
        y: pos.y,
        currentRadius: sd.currentRadius,
        alpha: sd.alpha,
        color: sd.color,
      });
    }
  }

  private renderDeployables(ctx: CanvasRenderingContext2D, currentTime: number): void {
    for (const entity of this.entityManager.getActiveDeployables()) {
      const pos = entity.get(Position)!;
      const col = entity.get(Collider)!;
      const deployableData = entity.get(DeployableData)!;

      renderDeployable(
        ctx,
        {
          x: pos.x,
          y: pos.y,
          radius: col.radius,
          type: deployableData.type,
          isArmed: entity.has(IsArmed),
          blinkOffset: deployableData.blinkOffset,
        },
        currentTime,
      );
    }
  }

  private renderPickups(ctx: CanvasRenderingContext2D): void {
    // Sort by ID for stable render order (Koota uses swap-remove, which shuffles query results)
    const pickups = [...this.entityManager.getActivePickups()].sort((a, b) => a.id() - b.id());
    const now = this.timeManager.getElapsed();

    for (const entity of pickups) {
      const pos = entity.get(Position)!;
      const col = entity.get(Collider)!;
      const vel = entity.get(Velocity)!;
      const pickupData = entity.get(PickupData)!;
      const lt = entity.get(Lifetime)!;
      const isAttracted = entity.has(IsAttracted);

      // Visual-only bobbing offset (only when stationary and not attracted)
      let yOffset = 0;
      const speed = Math.abs(vel.vx) + Math.abs(vel.vy);
      if (!isAttracted && speed < 5) {
        const time = now - pickupData.spawnTime;
        yOffset =
          Math.sin(time * GAME_BALANCE.pickup.bobbingSpeed + pickupData.animationOffset) *
          GAME_BALANCE.pickup.bobbingAmplitude;
      }

      // Replicate getScale() logic from adapter
      let scale = 1;
      if (!isAttracted && lt.remaining <= pickupData.shrinkDuration) {
        const shrinkProgress = 1 - lt.remaining / pickupData.shrinkDuration;
        scale = Math.max(0, 1 - shrinkProgress);
      }

      renderPickup(ctx, {
        x: pos.x,
        y: pos.y + yOffset,
        radius: col.radius,
        type: pickupData.type,
        scale,
      });
    }
  }

  /**
   * Render boss health bar at top of screen.
   */
  private renderBossHealthBar(ctx: CanvasRenderingContext2D): void {
    const bosses = this.entityManager.getActiveBosses();
    const bossData: BossRenderData[] = bosses.map((entity) => {
      const enemyData = entity.get(EnemyData)!;
      const h = entity.get(Health)!;
      return {
        type: enemyData.type,
        name: enemyData.bossName ?? enemyData.type,
        hp: h.hp,
        maxHp: h.maxHp,
      };
    });
    HUD.renderBossHealthBar(ctx, ctx.canvas.width, bossData);
  }
}
