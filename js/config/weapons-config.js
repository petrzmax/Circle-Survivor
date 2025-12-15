// Weapon type definitions

const WEAPON_TYPES = {
    pistol: {
        name: 'Pistolet',
        emoji: '🔫',
        fireRate: 500,
        damage: 10,
        bulletSpeed: 8,
        bulletCount: 1,
        spread: 0,
        price: 0,
        color: '#ffff00',
        range: 265,
        weaponCategory: 'gun'
    },
    smg: {
        name: 'SMG',
        emoji: '🔫',
        fireRate: 150,
        damage: 5,
        bulletSpeed: 10,
        bulletCount: 1,
        spread: 15,
        price: 50,
        color: '#ffa500',
        range: 215,
        weaponCategory: 'gun',
        knockbackMultiplier: 0.4
    },
    shotgun: {
        name: 'Shotgun',
        emoji: '💥',
        fireRate: 800,
        damage: 8,
        bulletSpeed: 7,
        bulletCount: 5,
        spread: 30,
        price: 80,
        color: '#ff4444',
        range: 140,
        weaponCategory: 'gun'
    },
    sniper: {
        name: 'Snajperka',
        emoji: '🎯',
        fireRate: 1500,
        damage: 50,
        bulletSpeed: 15,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        price: 100,
        color: '#00ffff',
        range: 400,
        weaponCategory: 'gun'
    },
    laser: {
        name: 'Laser',
        emoji: '⚡',
        fireRate: 100,
        damage: 3,
        bulletSpeed: 20,
        bulletCount: 1,
        spread: 5,
        price: 120,
        color: '#ff00ff',
        range: 350,
        weaponCategory: 'gun',
        knockbackMultiplier: 0.15
    },
    // ADVANCED WEAPONS
    minigun: {
        name: 'Minigun',
        emoji: '🔥',
        fireRate: 50,       // Super fast!
        damage: 2,          // Nerfed from 4
        bulletSpeed: 12,
        bulletCount: 1,
        spread: 20,
        price: 220,         // Increased from 150
        color: '#ff6600',
        range: 160,
        knockbackMultiplier: 0.3,  // Reduced knockback
        weaponCategory: 'gun'
    },
    bazooka: {
        name: 'Bazooka',
        emoji: '🚀',
        fireRate: 2000,
        damage: 80,
        bulletSpeed: 5,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 80,
        price: 180,
        color: '#ff0000',
        bulletRadius: 10,
        range: 310,
        weaponCategory: 'rocket'
    },
    flamethrower: {
        name: 'Miotacz Ognia',
        emoji: '🔥',
        fireRate: 80,
        damage: 2,
        bulletSpeed: 6,
        bulletCount: 3,
        spread: 40,
        price: 140,
        color: '#ff4400',
        bulletRadius: 6,
        shortRange: true,
        maxDistance: 120,
        range: 120,
        weaponCategory: 'special',
        knockbackMultiplier: 0
    },
    mines: {
        name: 'Miny',
        emoji: '💣',
        fireRate: 4500,
        damage: 60,
        bulletSpeed: 0,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 70,
        price: 130,
        color: '#333333',
        bulletRadius: 12,
        isMine: true,
        range: 9999,  // Mines don't need range limit
        weaponCategory: 'special'
    },
    nuke: {
        name: 'Wyrzutnia Nuklearna',
        emoji: '☢️',
        fireRate: 8000,
        damage: 300,
        bulletSpeed: 3,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 200,
        price: 500,
        color: '#00ff00',
        bulletRadius: 15,
        isNuke: true,
        range: 9999,  // Nuke shoots at any distance
        weaponCategory: 'rocket'
    },
    
    // === SPECIAL WEAPONS ===
    scythe: {
        name: 'Kosa Kubusia',
        emoji: '🌙',
        fireRate: 1200,
        damage: 35,
        bulletSpeed: 6,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        pierceCount: 10,
        price: 200,
        color: '#9932cc',
        bulletRadius: 20,
        isScythe: true,  // Rotates!
        range: 230,
        weaponCategory: 'melee'
    },
    sword: {
        name: 'Miecz Kamilka',
        emoji: '⚔️',
        fireRate: 700,
        damage: 10,
        bulletSpeed: 12,
        bulletCount: 3,
        spread: 60,
        price: 180,
        color: '#silver',
        bulletRadius: 8,
        isSword: true,
        shortRange: true,
        maxDistance: 100,
        range: 100,
        weaponCategory: 'melee',
        knockbackMultiplier: 0.3
    },
    holyGrenade: {
        name: 'Święty Granat',
        emoji: '✝️',
        fireRate: 3000,
        damage: 150,
        bulletSpeed: 4,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 120,
        price: 250,
        color: '#ffd700',
        bulletRadius: 12,
        isHolyGrenade: true,  // Special explosion!
        range: 275,
        weaponCategory: 'grenade',
        explosiveRange: 275
    },
    banana: {
        name: 'Banan z Worms',
        emoji: '🍌',
        fireRate: 2500,
        damage: 40,
        bulletSpeed: 5,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 90,
        price: 220,
        color: '#ffff00',
        bulletRadius: 10,
        isBanana: true,  // Splits into smaller ones!
        range: 235,
        weaponCategory: 'grenade',
        explosiveRange: 235
    },
    crossbow: {
        name: 'Kusza Przebijająca',
        emoji: '🏹',
        fireRate: 1000,
        damage: 60,
        bulletSpeed: 14,
        bulletCount: 1,
        spread: 0,
        pierce: true,
        pierceCount: 5,
        price: 280,
        color: '#8b4513',
        bulletRadius: 6,
        range: 320,
        weaponCategory: 'gun'
    },
    
    // === INTERNAL TYPE - mini banana ===
    minibanana: {
        name: 'Mini Banan',
        emoji: '🍌',
        fireRate: 0,
        damage: 16,           // 40% z 40
        bulletSpeed: 8,
        bulletCount: 1,
        spread: 0,
        explosive: true,
        explosionRadius: 45,  // 50% z 90
        price: 0,
        color: '#ffff00',
        bulletRadius: 6,
        isBanana: true,
        isMini: true,
        range: 80,
        weaponCategory: 'grenade',
        explosiveRange: 80
    }
};
