// Enemy type definitions and boss name generator

// Boss name generator arrays
const BOSS_NAME_PREFIXES = [
    'Kieł', 'Opus', 'Miłośnik', 'Marcel', 'Władca', 'Pan', 'Pogromca',
    'Cień', 'Gniew', 'Strach', 'Żelazny', 'Krwawy', 'Złoty', 'Mroczny',
    'Szalony', 'Bezlitosny', 'Potężny', 'Wielki', 'Starożytny', 'Niszczyciel', 'Ojciec', 'Matka'
];

const BOSS_NAME_SUFFIXES = [
    'Beredy', 'Radzimirskiego', 'Biznesu', 'Kustosz', 'Nocy', 'Chaosu', 'Kubicy', 'Kamilka', 'Podróżnika',
    'Ciemności', 'Zniszczenia', 'Śmierci', 'Otchłani', 'Piekła', 'Zagłady',
    'Burzy', 'Cieni', 'Krwi', 'Gromu', 'Wieczności', 'Pożogi', 'Zarazy', 'Koszmaru', 'Kazika', "Baagera"
];

function generateBossName() {
    const prefix = BOSS_NAME_PREFIXES[Math.floor(Math.random() * BOSS_NAME_PREFIXES.length)];
    const suffix = BOSS_NAME_SUFFIXES[Math.floor(Math.random() * BOSS_NAME_SUFFIXES.length)];
    return `${prefix} ${suffix}`;
}

const ENEMY_TYPES = {
    // Basic enemies
    basic: {
        name: 'Basic',
        color: '#e94560',
        radius: 15,
        speed: 1.5,
        hp: 20,
        damage: 15,
        xpValue: 10,
        goldValue: 2
    },
    fast: {
        name: 'Fast',
        color: '#ff8c00',
        radius: 10,
        speed: 3.5,
        hp: 10,
        damage: 8,
        xpValue: 15,
        goldValue: 4
    },
    tank: {
        name: 'Tank',
        color: '#9b59b6',
        radius: 28,
        speed: 0.7,
        hp: 100,
        damage: 35,
        xpValue: 35,
        goldValue: 9,
        canShoot: true,
        fireRate: 3000,
        bulletSpeed: 3,
        bulletDamage: 15,
        attackPatterns: ['single']
    },
    swarm: {
        name: 'Swarm',
        color: '#2ecc71',
        radius: 7,
        speed: 2.2,
        hp: 5,
        damage: 5,
        xpValue: 5,
        goldValue: 1
    },
    
    // Advanced enemy types
    sprinter: {
        name: 'Sprinter',
        color: '#00ffff',
        radius: 9,
        speed: 5,
        hp: 8,
        damage: 12,
        xpValue: 20,
        goldValue: 5
    },
    brute: {
        name: 'Brute',
        color: '#8b0000',
        radius: 35,
        speed: 0.5,
        hp: 200,
        damage: 60,
        xpValue: 60,
        goldValue: 15,
        canShoot: true,
        fireRate: 3000,
        bulletSpeed: 3,
        bulletDamage: 25,
        attackPatterns: ['single']
    },
    ghost: {
        name: 'Ghost',
        color: 'rgba(255, 255, 255, 0.6)',
        radius: 14,
        speed: 2,
        hp: 15,
        damage: 20,
        xpValue: 25,
        goldValue: 6,
        phasing: true // Can be semi-transparent
    },
    exploder: {
        name: 'Exploder',
        color: '#ffff00',
        radius: 12,
        speed: 1.8,
        hp: 25,
        damage: 5,
        xpValue: 20,
        goldValue: 5,
        explodeOnDeath: true,
        explosionRadius: 60,
        explosionDamage: 15
    },
    zigzag: {
        name: 'Zigzag',
        color: '#ff69b4',
        radius: 11,
        speed: 2.5,
        hp: 18,
        damage: 8,
        xpValue: 18,
        goldValue: 4,
        zigzag: true
    },
    splitter: {
        name: 'Splitter',
        color: '#7cfc00',
        radius: 20,
        speed: 1.2,
        hp: 40,
        damage: 12,
        xpValue: 25,
        goldValue: 7,
        splitOnDeath: true,
        splitCount: 3
    },
    
    // ============ BOSSES ============
    boss: {
        name: 'BOSS',
        color: '#ff0000',
        radius: 50,
        speed: 0.4,
        hp: 750,
        damage: 50,
        xpValue: 200,
        goldValue: 50,
        isBoss: true,
        canShoot: true,
        fireRate: 1300,
        bulletSpeed: 4,
        bulletDamage: 20,
        attackPatterns: ['single', 'spread']
    },
    bossSwarm: {
        name: 'BOSS',
        color: '#00ff00',
        radius: 45,
        speed: 0.6,
        hp: 600,
        damage: 30,
        xpValue: 250,
        goldValue: 60,
        isBoss: true,
        splitOnDeath: true,
        splitCount: 8,
        canShoot: true,
        fireRate: 1000,
        bulletSpeed: 5,
        bulletDamage: 10,
        attackPatterns: ['single', 'spread']
    },
    bossTank: {
        name: 'BOSS',
        color: '#8b00ff',
        radius: 65,
        speed: 0.25,
        hp: 1500,
        damage: 80,
        xpValue: 300,
        goldValue: 75,
        isBoss: true,
        canShoot: true,
        fireRate: 2000,
        bulletSpeed: 3,
        bulletDamage: 35,
        attackPatterns: ['single', 'shockwave']
    },
    bossSpeed: {
        name: 'BOSS',
        color: '#00ffff',
        radius: 40,
        speed: 1.2,
        hp: 500,
        damage: 35,
        xpValue: 220,
        goldValue: 55,
        isBoss: true,
        zigzag: true,
        canShoot: true,
        fireRate: 550,
        bulletSpeed: 7,
        bulletDamage: 12,
        attackPatterns: ['single', 'spread']
    },
    bossExploder: {
        name: 'BOSS',
        color: '#ffff00',
        radius: 55,
        speed: 0.35,
        hp: 900,
        damage: 40,
        xpValue: 280,
        goldValue: 70,
        isBoss: true,
        explodeOnDeath: true,
        explosionRadius: 150,
        explosionDamage: 50,
        canShoot: true,
        fireRate: 1600,
        bulletSpeed: 4,
        bulletDamage: 25,
        attackPatterns: ['spread', 'shockwave']
    },
    bossGhost: {
        name: 'BOSS',
        color: 'rgba(255, 255, 255, 0.7)',
        radius: 48,
        speed: 0.55,
        hp: 700,
        damage: 45,
        xpValue: 260,
        goldValue: 65,
        isBoss: true,
        phasing: true,
        canShoot: true,
        fireRate: 1200,
        bulletSpeed: 5,
        bulletDamage: 18,
        attackPatterns: ['single', 'spread']
    }
};
