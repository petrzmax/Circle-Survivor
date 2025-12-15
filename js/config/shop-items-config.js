// Shop items and character definitions

const SHOP_ITEMS = {
    // ============ BRONIE ============
    pistol: {
        type: 'weapon',
        weaponType: 'pistol',
        name: 'Pistolet',
        description: 'Podstawowa broń, niezawodna',
        price: 30,
        emoji: '🔫'
    },
    smg: {
        type: 'weapon',
        weaponType: 'smg',
        name: 'SMG',
        description: 'Szybki ogień, niskie obrażenia',
        price: 50,
        emoji: '�'
    },
    shotgun: {
        type: 'weapon',
        weaponType: 'shotgun',
        name: 'Shotgun',
        description: '5 pocisków na strzał',
        price: 80,
        emoji: '💥'
    },
    sniper: {
        type: 'weapon',
        weaponType: 'sniper',
        name: 'Snajperka',
        description: 'Wysokie obrażenia, przebija',
        price: 100,
        emoji: '🎯'
    },
    laser: {
        type: 'weapon',
        weaponType: 'laser',
        name: 'Laser',
        description: 'Ciągły ogień',
        price: 120,
        emoji: '⚡'
    },
    minigun: {
        type: 'weapon',
        weaponType: 'minigun',
        name: 'Minigun',
        description: 'Ekstremalnie szybki ogień!',
        price: 150,
        emoji: '🔥'
    },
    bazooka: {
        type: 'weapon',
        weaponType: 'bazooka',
        name: 'Bazooka',
        description: 'Rakieta z eksplozją obszarową',
        price: 180,
        emoji: '🚀'
    },
    flamethrower: {
        type: 'weapon',
        weaponType: 'flamethrower',
        name: 'Miotacz Ognia',
        description: 'Krótki zasięg, duże obrażenia',
        price: 140,
        emoji: '🔥'
    },
    mines: {
        type: 'weapon',
        weaponType: 'mines',
        name: 'Miny',
        description: 'Stawiaj pułapki za sobą',
        price: 130,
        emoji: '💣'
    },
    nuke: {
        type: 'weapon',
        weaponType: 'nuke',
        name: 'Wyrzutnia Nuklearna',
        description: 'BOOM! Ogromna eksplozja',
        price: 500,
        emoji: '☢️',
        minWave: 5
    },
    // Nowe bronie specjalne
    scythe: {
        type: 'weapon',
        weaponType: 'scythe',
        name: 'Kosa Kubusia',
        description: 'Obracająca się kosa, przebija wielu',
        price: 200,
        emoji: '🌙'
    },
    sword: {
        type: 'weapon',
        weaponType: 'sword',
        name: 'Miecz Kamilka',
        description: 'Szybkie cięcia w łuk',
        price: 180,
        emoji: '⚔️'
    },
    holyGrenade: {
        type: 'weapon',
        weaponType: 'holyGrenade',
        name: 'Święty Granat',
        description: 'Błogosławiona eksplozja!',
        price: 250,
        emoji: '✝️'
    },
    banana: {
        type: 'weapon',
        weaponType: 'banana',
        name: 'Banan z Worms',
        description: 'Klasyczny banan-bomba',
        price: 220,
        emoji: '🍌'
    },
    crossbow: {
        type: 'weapon',
        weaponType: 'crossbow',
        name: 'Kusza Przebijająca',
        description: 'Przebija do 5 wrogów!',
        price: 280,
        emoji: '🏹'
    },

    // ============ 20 PRZEDMIOTÓW ============
    
    // --- Defensywne ---
    ironArmor: {
        type: 'item',
        name: 'Żelazna Zbroja',
        description: '+10 Pancerza',
        price: 60,
        emoji: '🛡️',
        effect: { armor: 10 }
    },
    titaniumPlate: {
        type: 'item',
        name: 'Płyta Tytanowa',
        description: '+20 Pancerza',
        price: 120,
        emoji: '🔰',
        effect: { armor: 20 }
    },
    dodgeCloak: {
        type: 'item',
        name: 'Peleryna Uniku',
        description: '+5% szansy na unik',
        price: 80,
        emoji: '🧥',
        effect: { dodge: 0.05 }
    },
    thornMail: {
        type: 'item',
        name: 'Kolczuga Cierni',
        description: 'Odbija 5 obrażeń',
        price: 90,
        emoji: '🌵',
        effect: { thorns: 5 }
    },
    heartContainer: {
        type: 'item',
        name: 'Pojemnik na Serce',
        description: '+30 Max HP',
        price: 100,
        emoji: '💖',
        effect: { maxHp: 30 }
    },
    regenRing: {
        type: 'item',
        name: 'Pierścień Regeneracji',
        description: '+1 HP/s',
        price: 85,
        emoji: '💍',
        effect: { regen: 1 }
    },

    // --- Ofensywne ---
    damageGem: {
        type: 'item',
        name: 'Klejnot Mocy',
        description: '+20% obrażeń',
        price: 70,
        emoji: '💎',
        effect: { damageMultiplier: 0.2 }
    },
    critGloves: {
        type: 'item',
        name: 'Rękawice Krytyka',
        description: '+10% szansy na krytyka',
        price: 75,
        emoji: '🧤',
        effect: { critChance: 0.1 }
    },
    critDagger: {
        type: 'item',
        name: 'Sztylet Zabójcy',
        description: '+50% obrażeń krytycznych',
        price: 90,
        emoji: '🗡️',
        effect: { critDamage: 0.5 }
    },
    vampireFang: {
        type: 'item',
        name: 'Kieł Wampira',
        description: '+5% kradzieży życia',
        price: 110,
        emoji: '🦷',
        effect: { lifesteal: 0.05 }
    },
    explosiveRounds: {
        type: 'item',
        name: 'Zimna Wojna',
        description: '+25% zasięgu eksplozji',
        price: 95,
        emoji: '💥',
        effect: { explosionRadius: 0.25 }
    },
    multishot: {
        type: 'weaponBonus',
        name: 'Multishot',
        description: '+1 pocisk do losowej broni',
        price: 150,
        emoji: '🎯',
        bonusType: 'extraProjectiles',
        bonusValue: 1
    },
    piercingArrows: {
        type: 'item',
        name: 'Przebijające Strzały',
        description: '+2 przebicia',
        price: 100,
        emoji: '➡️',
        effect: { pierce: 2 }
    },

    // --- Utility ---
    speedBoots: {
        type: 'item',
        name: 'Buty Szybkości',
        description: '+8% szybkości ruchu',
        price: 55,
        emoji: '👢',
        effect: { speed: 0.3 }
    },
    magnet: {
        type: 'item',
        name: 'Magnes',
        description: '+25 zasięgu zbierania',
        price: 40,
        emoji: '🧲',
        effect: { pickupRange: 25 }
    },
    luckyClover: {
        type: 'item',
        name: 'Czterolistna Koniczyna',
        description: '+15% do dropów',
        price: 65,
        emoji: '🍀',
        effect: { luck: 0.15 }
    },
    xpBoost: {
        type: 'item',
        name: 'Księga Mądrości',
        description: '+25% zdobywanego XP',
        price: 80,
        emoji: '📚',
        effect: { xpMultiplier: 0.25 }
    },
    goldBoost: {
        type: 'item',
        name: 'Sakwa Skąpca',
        description: '+15% zdobywanego złota',
        price: 60,
        emoji: '💰',
        effect: { goldMultiplier: 0.15 }
    },
    attackSpeedGem: {
        type: 'item',
        name: 'Kryształ Furii',
        description: '+15% szybkości ataku',
        price: 85,
        emoji: '⚡',
        effect: { attackSpeedMultiplier: 0.15 }
    },
    
    // --- Zasięg broni ---
    scope: {
        type: 'item',
        name: 'Luneta',
        description: '+20% zasięgu broni',
        price: 80,
        emoji: '🔭',
        effect: { attackRange: 0.20 }
    },
    laserSight: {
        type: 'item',
        name: 'Celownik Laserowy',
        description: '+15% zasięgu, +5% crit',
        price: 120,
        emoji: '🎯',
        effect: { attackRange: 0.15, critChance: 0.05 }
    },
    
    allStats: {
        type: 'item',
        name: 'Korona Króla',
        description: '+10% do wszystkiego!',
        price: 200,
        emoji: '👑',
        effect: { 
            damageMultiplier: 0.1,
            attackSpeedMultiplier: 0.1,
            speed: 0.2,
            armor: 5,
            maxHp: 10
        }
    },
    
    // === LEGENDARNE PRZEDMIOTY ===
    bolidKubicy: {
        type: 'item',
        name: 'Bolid Kubicy',
        description: '+25% szybkości ruchu, +12% dodge!',
        price: 300,
        emoji: '🏎️',
        effect: { 
            speed: 1,
            dodge: 0.12
        }
    },
    kielichAlichi: {
        type: 'item',
        name: 'Kielich Alicji',
        description: '+10% lifesteal, +30 max HP, regen +1/s',
        price: 280,
        emoji: '🏆',
        effect: { 
            lifesteal: 0.10,
            maxHp: 30,
            regen: 1
        }
    },
    koronaPodroznika: {
        type: 'item',
        name: 'Korona Podróżnika',
        description: '+50% XP, +30% złota, +25% luck',
        price: 250,
        emoji: '🗺️',
        effect: { 
            xpMultiplier: 0.50,
            goldMultiplier: 0.30,
            luck: 0.25
        }
    },
    kierbceWierzbickiego: {
        type: 'item',
        name: 'Kierbce Wierzbickiego',
        description: '+40% DMG, +2 pociski, +20% crit!',
        price: 350,
        emoji: '🥊',
        effect: { 
            damageMultiplier: 0.40,
            projectileCount: 2,
            critChance: 0.20
        }
    },
    kijBejsbolowyByczka: {
        type: 'item',
        name: 'Kij Bejsbolowy Byczka',
        description: 'WUUUUUU! +100% odrzut wrogów!',
        price: 120,
        emoji: '🏏',
        effect: { 
            knockback: 1.0
        }
    },
    
    // === NOWE PRZEDMIOTY ===
    rekaMidasa: {
        type: 'item',
        name: 'Ręka Midasa',
        description: '+50% zdobywanego złota!',
        price: 180,
        emoji: '👑',
        effect: { goldMultiplier: 0.50 }
    },
    trzeciaReka: {
        type: 'item',
        name: 'Trzecia Ręka',
        description: '+1 slot na broń',
        price: 350,
        emoji: '✋',
        effect: { maxWeapons: 1 },
        minWave: 10
    },
    
    kopytoDzika: {
        type: 'item',
        name: 'Kopyto Prawdziwego Dzika',
        description: 'DZIK MODE! +15% speed, +15% DMG, +10 thorns!',
        price: 260,
        emoji: '🐗',
        effect: { 
            speed: 0.6,
            damageMultiplier: 0.15,
            thorns: 10
        }
    }
};

// Definicje postaci
const CHARACTER_TYPES = {
    wypaleniec: {
        name: 'Wypaleniec',
        description: 'Były pracownik korpo. Wypalony, ale wściekły.',
        color: '#ff6600',
        maxHp: 80,
        speed: 3.6,          // -10%
        damageMultiplier: 1.25, // +25%
        goldMultiplier: 1,
        startingWeapon: 'shotgun'
    },
    cwaniak: {
        name: 'Cwaniak',
        description: 'Zawsze znajdzie lukę w systemie.',
        color: '#00ff88',
        maxHp: 70,
        speed: 4.8,          // +20%
        damageMultiplier: 1,
        goldMultiplier: 1.3, // +30%
        startingWeapon: 'smg'
    },
    normik: {
        name: 'Normik',
        description: 'Przeciętny Kowalski. Zbalansowany we wszystkim.',
        color: '#4a9eff',
        maxHp: 100,
        speed: 4,
        damageMultiplier: 1,
        goldMultiplier: 1,
        startingWeapon: 'pistol'
    }
};
