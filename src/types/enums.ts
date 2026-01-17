/**
 * Enums for type-safe game constants.
 */

// ============ PROJECTILE TYPES ============

export enum ProjectileType {
  STANDARD = 'standard',
  ROCKET = 'rocket',
  SCYTHE = 'scythe',
  SWORD = 'sword',
  BANANA = 'banana',
  MINI_BANANA = 'miniBanana',
  HOLY_GRENADE = 'holyGrenade',
  CROSSBOW_BOLT = 'crossbowBolt',
  NUKE = 'nuke',
  FLAMETHROWER = 'flamethrower',
  ENEMY_BULLET = 'enemyBullet',
}

export enum DeployableType {
  MINE = 'mine',
  TURRET = 'turret',
  TRAP = 'trap',
}

// ============ VISUAL EFFECTS ============

/**
 * Visual effect types for explosions and special effects
 */
export enum VisualEffect {
  STANDARD = 'standard',
  NUKE = 'nuke',
  HOLY = 'holy',
  FIRE = 'fire',
  BANANA = 'banana',
}

// ============ GAME STATE ============

/**
 * Game state machine states.
 * Managed by StateManager via EventBus events.
 */
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  SHOP = 'shop',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
}

// ============ ENTITY TYPES ============

export enum EnemyType {
  BASIC = 'basic',
  FAST = 'fast',
  TANK = 'tank',
  SWARM = 'swarm',
  SPRINTER = 'sprinter',
  BRUTE = 'brute',
  GHOST = 'ghost',
  EXPLODER = 'exploder',
  ZIGZAG = 'zigzag',
  SPLITTER = 'splitter',
  // Bosses
  BOSS = 'boss',
  BOSS_SWARM = 'bossSwarm',
  BOSS_TANK = 'bossTank',
  BOSS_SPEED = 'bossSpeed',
  BOSS_EXPLODER = 'bossExploder',
  BOSS_GHOST = 'bossGhost',
}

export enum PickupType {
  GOLD = 'gold',
  HEALTH = 'health',
}

// ============ WEAPON TYPES ============

export enum WeaponType {
  PISTOL = 'pistol',
  SMG = 'smg',
  SHOTGUN = 'shotgun',
  SNIPER = 'sniper',
  LASER = 'laser',
  MINIGUN = 'minigun',
  BAZOOKA = 'bazooka',
  FLAMETHROWER = 'flamethrower',
  MINES = 'mines',
  NUKE = 'nuke',
  SCYTHE = 'scythe',
  SWORD = 'sword',
  HOLY_GRENADE = 'holyGrenade',
  BANANA = 'banana',
  CROSSBOW = 'crossbow',
}

/**
 * Weapon categories for behavior grouping
 */
export enum WeaponCategory {
  GUN = 'gun',
  ROCKET = 'rocket',
  SPECIAL = 'special',
  MELEE = 'melee',
  GRENADE = 'grenade',
  DEPLOYABLE = 'deployable',
}

// ============ CHARACTER TYPES ============

/**
 * Playable character types
 */
export enum CharacterType {
  WYPALENIEC = 'wypaleniec',
  CWANIAK = 'cwaniak',
  NORMIK = 'normik',
}
