/**
 * Shop items configuration.
 * Includes weapons, items, and legendary items available in the shop.
 */

import { WeaponType } from '@/domain/weapons/type';

/**
 * Item effect interface - stat bonuses from items
 */
export interface ItemEffect {
  armor?: number;
  dodge?: number;
  thorns?: number;
  maxHp?: number;
  regen?: number;
  damageMultiplier?: number;
  critChance?: number;
  critDamage?: number;
  lifesteal?: number;
  explosionRadius?: number;
  pierce?: number;
  speed?: number;
  pickupRange?: number;
  luck?: number;
  xpMultiplier?: number;
  goldMultiplier?: number;
  attackSpeedMultiplier?: number;
  attackRange?: number;
  projectileCount?: number;
  knockback?: number;
  maxWeapons?: number;
}

/**
 * Shop item type discriminator
 */
export type ShopItemType = 'weapon' | 'item' | 'weaponBonus';

/**
 * Base shop item interface
 */
export interface BaseShopItem {
  type: ShopItemType;
  name: string;
  description: string;
  price: number;
  emoji: string;
  minWave?: number;
}

/**
 * Weapon shop item
 */
export interface WeaponShopItem extends BaseShopItem {
  type: 'weapon';
  weaponType: WeaponType;
}

/**
 * Stat item shop item
 */
export interface StatShopItem extends BaseShopItem {
  type: 'item';
  effect: ItemEffect;
}

export type ShopItem = WeaponShopItem | StatShopItem;

/**
 * All shop items configuration
 */
export const SHOP_ITEMS: Record<string, ShopItem> = {
  // ============ WEAPONS ============
  pistol: {
    type: 'weapon',
    weaponType: WeaponType.PISTOL,
    name: 'Pistolet',
    description: 'Podstawowa broń, niezawodna',
    price: 30,
    emoji: '🔫',
  },
  smg: {
    type: 'weapon',
    weaponType: WeaponType.SMG,
    name: 'SMG',
    description: 'Szybki ogień, niskie obrażenia',
    price: 50,
    emoji: '💨',
  },
  shotgun: {
    type: 'weapon',
    weaponType: WeaponType.SHOTGUN,
    name: 'Shotgun',
    description: '5 pocisków na strzał',
    price: 80,
    emoji: '💥🔫',
  },
  sniper: {
    type: 'weapon',
    weaponType: WeaponType.SNIPER,
    name: 'Snajperka',
    description: 'Wysokie obrażenia, przebija',
    price: 100,
    emoji: '🎯🔫',
  },
  laser: {
    type: 'weapon',
    weaponType: WeaponType.LASER,
    name: 'Laser',
    description: 'Ciągły ogień',
    price: 120,
    emoji: '🔫⚡',
  },
  minigun: {
    type: 'weapon',
    weaponType: WeaponType.MINIGUN,
    name: 'Minigun',
    description: 'Ekstremalnie szybki ogień!',
    price: 150,
    emoji: '🔥',
  },
  bazooka: {
    type: 'weapon',
    weaponType: WeaponType.BAZOOKA,
    name: 'Bazooka',
    description: 'Rakieta z eksplozją obszarową',
    price: 180,
    emoji: '🚀',
  },
  flamethrower: {
    type: 'weapon',
    weaponType: WeaponType.FLAMETHROWER,
    name: 'Miotacz Ognia',
    description: 'Krótki zasięg, duże obrażenia',
    price: 140,
    emoji: '🔥🔫',
  },
  mines: {
    type: 'weapon',
    weaponType: WeaponType.MINES,
    name: 'Miny',
    description: 'Stawiaj pułapki za sobą',
    price: 130,
    emoji: '💣',
  },
  nuke: {
    type: 'weapon',
    weaponType: WeaponType.NUKE,
    name: 'Wyrzutnia Nuklearna',
    description: 'BOOM! Ogromna eksplozja',
    price: 500,
    emoji: '☢️',
    minWave: 5,
  },
  scythe: {
    type: 'weapon',
    weaponType: WeaponType.SCYTHE,
    name: 'Kosa Kubusia',
    description: 'Obracająca się kosa, przebija wielu',
    price: 200,
    emoji: '🌙',
  },
  sword: {
    type: 'weapon',
    weaponType: WeaponType.SWORD,
    name: 'Miecz Kamilka',
    description: 'Szybkie cięcia w łuk',
    price: 180,
    emoji: '⚔️',
  },
  holyGrenade: {
    type: 'weapon',
    weaponType: WeaponType.HOLY_GRENADE,
    name: 'Święty Granat',
    description: 'AAAlleelluujjaaa!',
    price: 250,
    emoji: '✝️',
  },
  banana: {
    type: 'weapon',
    weaponType: WeaponType.BANANA,
    name: 'Banan z Worms',
    description: 'Klasyczny banan-bomba',
    price: 220,
    emoji: '🍌',
  },
  crossbow: {
    type: 'weapon',
    weaponType: WeaponType.CROSSBOW,
    name: 'Kusza Przebijająca',
    description: 'Przebija do 3 wrogów!',
    price: 280,
    emoji: '🏹',
  },

  // ============ ITEMS - DEFENSIVE ============
  ironArmor: {
    type: 'item',
    name: 'Żelazna Zbroja',
    description: '+5 Pancerza',
    price: 60,
    emoji: '🛡️',
    effect: { armor: 5 },
  },
  titaniumPlate: {
    type: 'item',
    name: 'Płyta Tytanowa',
    description: '+10 Pancerza',
    price: 120,
    emoji: '🔰',
    effect: { armor: 10 },
  },
  dodgeCloak: {
    type: 'item',
    name: 'Peleryna Uniku',
    description: '+3% szansy na unik',
    price: 80,
    emoji: '🧥',
    effect: { dodge: 0.03 },
  },
  thornMail: {
    type: 'item',
    name: 'Kolczuga Cierni',
    description: 'Odbija 5 obrażeń',
    price: 90,
    emoji: '🌵',
    effect: { thorns: 5 },
  },
  heartContainer: {
    type: 'item',
    name: 'Pojemnik na Serce',
    description: '+30 Max HP',
    price: 100,
    emoji: '💖',
    effect: { maxHp: 30 },
  },
  regenRing: {
    type: 'item',
    name: 'Pierścień Regeneracji',
    description: '+0.5 HP/s',
    price: 85,
    emoji: '💍',
    effect: { regen: 0.5 },
  },

  // ============ ITEMS - OFFENSIVE ============
  damageGem: {
    type: 'item',
    name: 'Klejnot Mocy',
    description: '+10% obrażeń',
    price: 70,
    emoji: '💎',
    effect: { damageMultiplier: 0.1 },
  },
  critGloves: {
    type: 'item',
    name: 'Rękawice Krytyka',
    description: '+5% szansy na krytyka',
    price: 75,
    emoji: '🧤',
    effect: { critChance: 0.05 },
  },
  critDagger: {
    type: 'item',
    name: 'Sztylet Zabójcy',
    description: '+25% obrażeń krytycznych',
    price: 90,
    emoji: '🗡️',
    effect: { critDamage: 0.25 },
  },
  vampireFang: {
    type: 'item',
    name: 'Kieł Wampira',
    description: '+3% kradzieży życia',
    price: 110,
    emoji: '🦷',
    effect: { lifesteal: 0.03 },
  },
  coldWar: {
    type: 'item',
    name: 'Zimna Wojna',
    description: '+15% zasięgu eksplozji',
    price: 95,
    emoji: '💥',
    effect: { explosionRadius: 0.15 },
  },
  // TODO disabled because multishot does not work well / is too op
  // multishot: {
  //   type: 'weaponBonus',
  //   name: 'Multishot',
  //   description: '+1 pocisk do losowej broni',
  //   price: 150,
  //   emoji: '🎯',
  //   bonusType: 'extraProjectiles',
  //   bonusValue: 1,
  // },

  // TODO disabled because does not work well / is too op
  // piercingArrows: {
  //   type: 'item',
  //   name: 'Przebijające Strzały',
  //   description: '+2 przebicia',
  //   price: 100,
  //   emoji: '➡️',
  //   effect: { pierce: 2 },
  // },

  // ============ ITEMS - UTILITY ============
  speedBoots: {
    type: 'item',
    name: 'Buty Szybkości',
    description: '+8% szybkości ruchu',
    price: 55,
    emoji: '👢',
    effect: { speed: 18 },
  },
  magnet: {
    type: 'item',
    name: 'Magnes',
    description: '+25 zasięgu zbierania',
    price: 40,
    emoji: '🧲',
    effect: { pickupRange: 25 },
  },
  luckyClover: {
    type: 'item',
    name: 'Czterolistna Koniczyna',
    description: '+15% do dropów',
    price: 65,
    emoji: '🍀',
    effect: { luck: 0.15 },
  },
  xpBoost: {
    type: 'item',
    name: 'Księga Mądrości',
    description: '+25% zdobywanego XP',
    price: 80,
    emoji: '📚',
    effect: { xpMultiplier: 0.25 },
  },
  goldBoost: {
    type: 'item',
    name: 'Sakwa Skąpca',
    description: '+15% zdobywanego złota',
    price: 60,
    emoji: '💰',
    effect: { goldMultiplier: 0.15 },
  },
  attackSpeedGem: {
    type: 'item',
    name: 'Kryształ Furii',
    description: '+8% szybkości ataku',
    price: 85,
    emoji: '⚡',
    effect: { attackSpeedMultiplier: 0.08 },
  },

  // ============ ITEMS - WEAPON RANGE ============
  scope: {
    type: 'item',
    name: 'Luneta',
    description: '+20% zasięgu broni',
    price: 80,
    emoji: '🔭',
    effect: { attackRange: 0.2 },
  },
  laserSight: {
    type: 'item',
    name: 'Celownik Laserowy',
    description: '+15% zasięgu, +5% crit',
    price: 120,
    emoji: '🎯',
    effect: { attackRange: 0.15, critChance: 0.05 },
  },

  // ============ ITEMS - ALL STATS ============
  allStats: {
    type: 'item',
    name: 'Korona Króla',
    description: '+10% do wszystkiego!',
    price: 200,
    emoji: '👑',
    effect: {
      damageMultiplier: 0.1,
      attackSpeedMultiplier: 0.1,
      speed: 12,
      armor: 5,
      maxHp: 10,
    },
  },

  // ============ LEGENDARY ITEMS ============
  bolidKubicy: {
    type: 'item',
    name: 'Bolid Kubicy',
    description: '+25% szybkości ruchu, +10% dodge!',
    price: 300,
    emoji: '🏎️',
    effect: {
      speed: 60, // TODO what, adjust / fix
      dodge: 0.1,
    },
  },
  kielichAlicji: {
    type: 'item',
    name: 'Kielich Alicji',
    description: '+5% lifesteal, +30 max HP, regen +0.5/s',
    price: 280,
    emoji: '🏆',
    effect: {
      lifesteal: 0.05,
      maxHp: 30,
      regen: 0.5,
    },
  },
  koronaPodroznika: {
    type: 'item',
    name: 'Korona Podróżnika',
    description: '+25% XP, +15% złota, +15% luck',
    price: 250,
    emoji: '🗺️',
    effect: {
      xpMultiplier: 0.25,
      goldMultiplier: 0.15,
      luck: 0.15,
    },
  },
  kierbceWierzbickiego: {
    type: 'item',
    name: 'Kierbce Wierzbickiego',
    description: '+20% DMG, +10% crit!',
    price: 350,
    emoji: '🥊',
    effect: {
      damageMultiplier: 0.2,
      // projectileCount: 2, TODO disabled because multishot does not work well / is too op
      critChance: 0.1,
    },
  },
  kijBejsbolowyByczka: {
    type: 'item',
    name: 'Kij Bejsbolowy Byczka',
    description: 'WUUUUUU! +50% odrzut wrogów!',
    price: 120,
    emoji: '🏏',
    effect: {
      knockback: 0.5,
    },
  },

  // ============ NEW ITEMS ============
  midasHand: {
    type: 'item',
    name: 'Ręka Midasa',
    description: '+30% zdobywanego złota!',
    price: 180,
    emoji: '✋💰',
    effect: { goldMultiplier: 0.3 },
  },
  thirdHand: {
    type: 'item',
    name: 'Trzecia Ręka',
    description: '+1 slot na broń',
    price: 350,
    emoji: '✋',
    effect: { maxWeapons: 1 },
    minWave: 10,
  },
  boarHoof: {
    type: 'item',
    name: 'Kopyto Prawdziwego Dzika',
    description: 'DZIK MODE! +15% speed, +15% DMG, +10 thorns!',
    price: 260,
    emoji: '🐗',
    effect: {
      speed: 36,
      damageMultiplier: 0.15,
      thorns: 10,
    },
  },
} as const;
