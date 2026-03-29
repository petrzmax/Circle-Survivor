/**
 * Central game balance configuration.
 * All multipliers and scaling factors affecting gameplay difficulty and progression.
 *
 * This file contains all "magic numbers" that control game balance.
 * Adjusting these values allows fine-tuning difficulty without searching through code.
 */

export const GAME_BALANCE = {
  /**
   * Shared physics constants.
   * Applies to all entities processed by PhysicsSystem.
   */
  physics: {
    /** Repulsion force multiplier per pixel of overlap. Used for all entity separation. */
    separationForce: 4,
    /** How much entity size (area) affects mass. 0 = all enemies equal mass,
     *  1 = pure area-based (small enemies very light, bosses very heavy). */
    massAreaInfluence: 0.75,
  },

  /**
   * Enemy and boss scaling.
   * All enemies (including bosses) get progressively stronger each wave.
   *
   * Example: On wave 5, with default values:
   * - Stats: base × 1.04^(5-1) = base × 1.17 (+17% HP and damage)
   */
  enemy: {
    /** Per-wave multiplier. Applied as Math.pow(factor, wave - 1). */
    scalingFactor: 1.04,
    /** Knockback impulse for non-projectile damage (contact, shockwave → player). */
    contactKnockback: 400,
    /** Knockback coefficient for momentum-based projectile hits: impulse = this × playerKnockback × mass × speed. */
    knockbackPerMomentum: 0.18,
    /** Enemy bullet radius as fraction of enemy radius. */
    bulletRadiusRatio: 0.15,
  },

  /**
   * Wave timing and spawn configuration.
   * Controls how long waves last and how quickly enemies appear.
   */
  wave: {
    /** Milliseconds between enemy spawn ticks. Lower = more frequent spawns. */
    spawnInterval: 1200,
    /** Number of enemies spawned per tick. */
    enemiesPerSpawn: 2,
    /** Wave duration in seconds by game phase. */
    duration: {
      /** Waves 1-2: shorter for early game warmup. */
      early: 25,
      /** Waves 3-4: medium length as difficulty ramps. */
      mid: 35,
      /** Waves 5+: full length waves for sustained challenge. */
      late: 40,
    },
  },

  /**
   * Player stat defaults and formulas.
   * Base values applied to all characters before bonuses.
   */
  player: {
    /** Default critical hit damage multiplier. Crit deals base × this value. */
    baseCritMultiplier: 1.5,
    /** Invincibility frames after taking damage (milliseconds). Prevents burst damage. */
    invincibilityMs: 300,
    /** Armor diminishing returns divisor. Formula: armor / (armor + this value).
     *  With 100: 50 armor = 33% reduction, 100 armor = 50%, 200 armor = 67% */
    armorDiminishingFactor: 100,
    /** Maximum dodge chance cap. 0.6 = 60% max dodge to prevent overpowered builds. */
    maxDodge: 0.6,
    /** Physics mass for player. Affects knockback magnitude (impulse / mass). */
    mass: 1,
    /** Physics friction for player. Higher = faster deceleration. Frame-rate independent. */
    friction: 0.4,
  },

  /**
   * Economy: shop prices and reroll costs.
   * Controls gold sink and progression pacing.
   */
  economy: {
    /** Shop price scaling factors. Final price = base × wave multipliers. */
    priceScale: {
      /** Price increase per wave after startWave. 0.15 = +15% per wave. */
      perWave: 0.2,
    },
    /** Reroll cost scaling. Discourages excessive rerolling. */
    reroll: {
      /** Base reroll cost in gold. */
      baseCost: 3,
      /** Cost increase per wave. 0.2 = +20% per wave. */
      perWave: 0.15,
      /** Cost increase per reroll used this shop visit. 0.5 = +50% per reroll. */
      perReroll: 0.3,
    },
    /** Weapon selling configuration. */
    sell: {
      /** Sell price multiplier (0.3 = 30% of buy price). */
      priceMultiplier: 0.3,
      /** Extra value per weapon level (0.5 = +50% per level above 1). */
      levelMultiplier: 0.5,
    },
  },

  /**
   * Combat mechanics multipliers.
   * Affects explosions and special attack behaviors.
   */
  combat: {
    /** Explosion damage falloff at edge. 0.5 = 50% damage at max radius, 100% at center. */
    explosionFalloff: 0.2,
    /** Explosion knockback impulse (px/s). Scaled by distance falloff and divided by entity mass. */
    explosionKnockback: 300,
    /** Shockwave knockback impulse (px/s). Applied once as the ring passes through an entity. */
    shockwaveKnockback: 400,
    /** Speed (px/s) below which a grenade is considered "landed" and should explode. */
    grenadeStopSpeed: 35,
  },

  /**
   * Weapon upgrade scaling.
   * Applied when player upgrades existing weapons in shop.
   */
  weapons: {
    /** Maximum weapon level. Weapons at this level cannot be merged further. */
    maxLevel: 5,
    upgrade: {
      /** Damage multiplier per upgrade level. 1.3 = +30% damage per level. */
      damagePerLevel: 1.3,
      /** Attack speed multiplier per level. 1.1 = +10% faster firing per level. */
      attackSpeedPerLevel: 1.1,
      /** Explosion radius multiplier per level. 1.15 = +15% larger explosions per level. */
      explosionPerLevel: 1.1,
    },
  },

  /**
   * Drop rates for pickups.
   * Controls loot from enemy deaths.
   */
  drops: {
    /** Base health drop chance (0.15 = 15%). Affected by luck stat. */
    healthDropChance: 0.1,
    /** Luck bonus multiplier for health drops. Final chance = base + luck * this. */
    healthDropLuckMultiplier: 0.2,
    /** Health pickup heal amount. */
    healthDropValue: 6,
  },

  /**
   * Pickup attraction mechanics.
   * Controls how pickups move toward the player.
   */
  pickup: {
    /** Physics mass for pickups. Lower = bigger knockback from explosions. */
    mass: 0.3,
    /** Physics friction for pickups. Controls how fast they decelerate after being pushed. */
    friction: 0.16,
    /** Base attraction force magnitude. Applied as impulse each frame when magnet is active. */
    attractionForce: 2000,
    /** Seconds for attraction force to ramp from 0 to full strength. */
    attractionRampUpDuration: 0.8,
    /** Minimum distance factor multiplier. Pickups never move slower than base × this. */
    minDistanceFactor: 0.5,
    /** Maximum distance factor multiplier. Pickups at player position move at base × this. */
    maxDistanceFactor: 2.0,
  },
} as const;

/** Type for the game balance configuration */
export type GameBalanceConfig = typeof GAME_BALANCE;

/** Type for weapon upgrade configuration */
export type WeaponUpgradeConfig = GameBalanceConfig['weapons']['upgrade'];
