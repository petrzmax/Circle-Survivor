/**
 * Entity interfaces defining the shape of game objects.
 */

import type {
  ITransform,
  IVelocity,
  ICircleCollider,
  IRenderable,
  IUpdatable,
  IHealth,
  IDamageDealer,
  IKnockbackable,
  IExpirable,
} from './components';
import type {
  ProjectileType,
  DeployableType,
  EnemyType,
  PickupType,
  WeaponType,
  VisualEffect,
} from './enums';

// ============ BASE ENTITY ============

/**
 * Base entity interface - all game objects have these
 */
export interface IEntity extends ITransform, IRenderable, IUpdatable {
  id: string;
}

/**
 * Entity with physics (position + velocity + collision)
 */
export interface IPhysicsEntity extends IEntity, IVelocity, ICircleCollider {}

/**
 * Entity that can participate in combat
 */
export interface ICombatEntity extends IPhysicsEntity, IHealth, IKnockbackable {}

// ============ PROJECTILE ============

/**
 * Explosive component for projectiles
 */
export interface IExplosiveComponent {
  explosionRadius: number;
  visualEffect: VisualEffect;
}

/**
 * Pierce component for projectiles that go through enemies
 */
export interface IPierceComponent {
  maxPierces: number;
  hitEnemies: Set<string>;
  canHit(enemyId: string): boolean;
}

/**
 * Chain component for projectiles that chain between enemies
 */
export interface IChainComponent {
  maxChains: number;
  damageMultiplier: number;
}

/**
 * Projectile interface - flying bullets
 */
export interface IProjectile extends IPhysicsEntity, IDamageDealer {
  type: ProjectileType;
  ownerId: 'player' | 'enemy';
  color: string;
  
  // Optional components
  explosive?: IExplosiveComponent;
  pierce?: IPierceComponent;
  chain?: IChainComponent;
  
  // Short range weapons
  maxDistance?: number;
  distanceTraveled: number;
  startX: number;
  startY: number;
  
  // State
  isCrit: boolean;
  
  isOffScreen(canvasWidth: number, canvasHeight: number): boolean;
  shouldExpire(): boolean;
}

// ============ DEPLOYABLE ============

/**
 * Deployable interface - static objects like mines, turrets
 */
export interface IDeployable extends IEntity, ICircleCollider, IExpirable {
  type: DeployableType;
  ownerId: string;
  isArmed: boolean;
  armDelay: number;
  
  onTrigger(): void;
}

// ============ PICKUP ============

/**
 * Pickup interface - collectible items
 */
export interface IPickup extends IEntity, ICircleCollider, IExpirable {
  type: PickupType;
  value: number;
  
  // Magnet effect
  magnetTarget?: ITransform;
  magnetSpeed: number;
}

// ============ ENEMY ============

/**
 * Enemy interface
 */
export interface IEnemy extends ICombatEntity {
  type: EnemyType;
  color: string;
  xpValue: number;
  goldValue: number;
  
  // Special properties
  isBoss: boolean;
  bossName?: string;
  
  // Movement patterns
  zigzag: boolean;
  phasing: boolean;
  
  // Combat
  canShoot: boolean;
  fireRate: number;
  bulletDamage: number;
  bulletSpeed: number;
  lastFireTime: number;
  attackPatterns: string[];
  
  // Death effects
  explodeOnDeath: boolean;
  explosionRadius: number;
  explosionDamage: number;
  splitOnDeath: boolean;
  splitCount: number;
  
  // Arena bounds
  hasEnteredArena: boolean;
}

// ============ WEAPON ============

/**
 * Weapon interface
 */
export interface IWeapon {
  type: WeaponType;
  name: string;
  emoji: string;
  level: number;
  
  // Stats
  damage: number;
  baseDamage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletCount: number;
  spread: number;
  range: number;
  color: string;
  
  // Special properties
  pierce: boolean;
  pierceCount: number;
  explosive: boolean;
  explosionRadius: number;
  chain: boolean;
  chainCount: number;
  knockbackMultiplier: number;
  
  // State
  lastFired: number;
  fireOffset: number;
  extraProjectiles: number;
  
  canFire(currentTime: number): boolean;
  fire(x: number, y: number, targetX: number, targetY: number, currentTime: number): IProjectile[];
  upgrade(): void;
}

// ============ PLAYER ============

/**
 * Player stats interface
 */
export interface IPlayerStats {
  // Core
  maxHp: number;
  speed: number;
  pickupRange: number;
  
  // Combat
  armor: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  critChance: number;
  critDamage: number;
  lifesteal: number;
  knockback: number;
  explosionRadius: number;
  projectileCount: number;
  pierce: number;
  attackRange: number;
  
  // Utility
  luck: number;
  xpMultiplier: number;
  goldMultiplier: number;
  dodge: number;
  thorns: number;
  regen: number;
}

/**
 * Player interface
 */
export interface IPlayer extends ICombatEntity {
  // Dimensions (for rendering)
  width: number;
  height: number;
  color: string;
  
  // Stats
  stats: IPlayerStats;
  
  // Equipment
  weapons: IWeapon[];
  maxWeapons: number;
  items: string[];
  
  // State
  invincibleUntil: number;
  invincibleDuration: number;
  
  // Methods
  addWeapon(type: WeaponType): boolean;
  fireAllWeapons(target: ITransform | null, currentTime: number): IProjectile[];
}
