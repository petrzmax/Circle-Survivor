/**
 * Central game balance configuration.
 * All multipliers and scaling factors affecting gameplay difficulty and progression.
 * 
 * This file contains all "magic numbers" that control game balance.
 * Adjusting these values allows fine-tuning difficulty without searching through code.
 * 
 * @typedef {Object} GameBalance
 */
const GAME_BALANCE = {
    /**
     * Boss scaling parameters.
     * Bosses appear every 3rd wave (3, 6, 9, ...) and get stronger with each appearance.
     * 
     * Example: On wave 9 (3rd boss), with default values:
     * - HP: base × (1 + (3-1) × 0.5) × 1.04^2 = base × 2.16
     * - DMG: base × (1 + (3-1) × 0.25) × 1.04^2 = base × 1.62
     */
    boss: {
        /** HP increase per boss wave. 0.5 = +50% HP for 2nd boss, +100% for 3rd, etc. */
        hpScalePerWave: 0.5,
        /** Damage increase per boss wave. 0.25 = +25% DMG per boss appearance. */
        dmgScalePerWave: 0.25,
        /** Exponential scaling base. Applied as Math.pow(base, bossWave-1) from wave 3. */
        exponentialBase: 1.04,
        /** Contact damage multiplier. Boss melee hits deal base damage × this value. */
        contactDamageMultiplier: 1.25,
        /** Knockback resistance. Lower = harder to push. Normal enemies use 3. */
        knockbackResistance: 1
    },

    /**
     * Regular enemy scaling.
     * Enemies get progressively stronger as waves increase.
     * 
     * Example: On wave 10, with default values:
     * - Stats: base × 1.04^(10-5) = base × 1.22 (+22% HP and damage)
     */
    enemy: {
        /** Wave number when scaling begins. Before this, enemies have base stats. */
        scalingStartWave: 5,
        /** Per-wave multiplier. Applied as Math.pow(factor, wave - startWave). */
        scalingFactor: 1.04,
        /** Knockback multiplier for normal enemies. Higher = easier to push back. */
        knockbackMultiplier: 3
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
            late: 40
        }
    },

    /**
     * Player stat defaults and formulas.
     * Base values applied to all characters before bonuses.
     */
    player: {
        /** Default critical hit damage multiplier. Crit deals base × this value. */
        baseCritMultiplier: 1.5,
        /** Invincibility frames after taking damage (milliseconds). Prevents burst damage. */
        invincibilityMs: 500,
        /** Armor diminishing returns divisor. Formula: armor / (armor + this value). 
         *  With 100: 50 armor = 33% reduction, 100 armor = 50%, 200 armor = 67% */
        armorDiminishingFactor: 100
    },

    /**
     * Economy: shop prices and reroll costs.
     * Controls gold sink and progression pacing.
     */
    economy: {
        /** Shop price scaling factors. Final price = base × wave × item × weapon multipliers. */
        priceScale: {
            /** Price increase per wave after startWave. 0.15 = +15% per wave. */
            perWave: 0.15,
            /** Price increase per owned item. 0.08 = +8% per item owned. */
            perItem: 0.08,
            /** Price increase per owned weapon. 0.10 = +10% per weapon owned. */
            perWeapon: 0.10,
            /** Wave when price scaling begins. Before this, prices are base values. */
            startWave: 5
        },
        /** Reroll cost scaling. Discourages excessive rerolling. */
        reroll: {
            /** Base reroll cost in gold. */
            baseCost: 15,
            /** Cost increase per wave. 0.2 = +20% per wave. */
            perWave: 0.2,
            /** Cost increase per reroll used this shop visit. 0.5 = +50% per reroll. */
            perReroll: 0.5
        }
    },

    /**
     * Combat mechanics multipliers.
     * Affects explosions, chain effects, and special attack behaviors.
     */
    combat: {
        /** Explosion damage falloff at edge. 0.5 = 50% damage at max radius, 100% at center. */
        explosionFalloff: 0.5,
        /** Chain lightning damage retention. 0.5 = each jump deals 50% of previous hit. */
        chainDamageMultiplier: 0.5,
        /** Maximum distance for chain to jump to next enemy (pixels). */
        chainRange: 150,
        /** Explosion knockback force multiplier. */
        explosionKnockback: 5
    },

    /**
     * Weapon upgrade scaling.
     * Applied when player upgrades existing weapons in shop.
     */
    weapons: {
        upgrade: {
            /** Damage multiplier per upgrade level. 1.3 = +30% damage per level. */
            damagePerLevel: 1.3,
            /** Attack speed multiplier per level. 1.1 = +10% faster firing per level. */
            attackSpeedPerLevel: 1.1,
            /** Explosion radius multiplier per level. 1.15 = +15% larger explosions per level. */
            explosionPerLevel: 1.15
        }
    }
};
