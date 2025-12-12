// Shop system

const SHOP_ITEMS = {
    // ============ BRONIE ============
    smg: {
        type: 'weapon',
        weaponType: 'smg',
        name: 'SMG',
        description: 'Szybki ogień, niskie obrażenia',
        price: 50,
        emoji: '🔫'
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
        description: '+15 Pancerza',
        price: 60,
        emoji: '🛡️',
        effect: { armor: 15 }
    },
    titaniumPlate: {
        type: 'item',
        name: 'Płyta Tytanowa',
        description: '+30 Pancerza',
        price: 120,
        emoji: '🔰',
        effect: { armor: 30 }
    },
    dodgeCloak: {
        type: 'item',
        name: 'Peleryna Uniku',
        description: '+8% szansy na unik',
        price: 80,
        emoji: '🧥',
        effect: { dodge: 0.08 }
    },
    thornMail: {
        type: 'item',
        name: 'Kolczuga Cierni',
        description: 'Odbija 10 obrażeń',
        price: 90,
        emoji: '🌵',
        effect: { thorns: 10 }
    },
    heartContainer: {
        type: 'item',
        name: 'Pojemnik na Serce',
        description: '+50 Max HP',
        price: 100,
        emoji: '💖',
        effect: { maxHp: 50 }
    },
    regenRing: {
        type: 'item',
        name: 'Pierścień Regeneracji',
        description: '+2 HP/s',
        price: 85,
        emoji: '💍',
        effect: { regen: 2 }
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
        name: 'Wybuchowa Amunicja',
        description: '+25% zasięgu eksplozji',
        price: 95,
        emoji: '💥',
        effect: { explosionRadius: 0.25 }
    },
    multishot: {
        type: 'item',
        name: 'Multishot',
        description: '+1 dodatkowy pocisk',
        price: 150,
        emoji: '🎯',
        effect: { projectileCount: 1 }
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
        description: '+40 zasięgu zbierania',
        price: 40,
        emoji: '🧲',
        effect: { pickupRange: 40 }
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
            armor: 10,
            maxHp: 20
        }
    },
    
    // === LEGENDARNE PRZEDMIOTY ===
    bolidKubicy: {
        type: 'item',
        name: 'Bolid Kubicy',
        description: '+25% szybkości ruchu, +20% dodge!',
        price: 300,
        emoji: '🏎️',
        effect: { 
            speed: 1,
            dodge: 0.20
        }
    },
    kielichAlichi: {
        type: 'item',
        name: 'Kielich Alicji',
        description: '+10% lifesteal, +30 max HP, regen +2/s',
        price: 280,
        emoji: '🏆',
        effect: { 
            lifesteal: 0.10,
            maxHp: 30,
            regen: 2
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
        description: '+50% zdobywanego złota (najlepszy!)',
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
        description: 'DZIK MODE! +15% speed, +15% DMG, +20 thorns!',
        price: 260,
        emoji: '🐗',
        effect: { 
            speed: 0.6,
            damageMultiplier: 0.15,
            thorns: 20
        }
    },

    // ============ ULEPSZENIA BRONI ============
    weaponUpgrade: {
        type: 'weaponUpgrade',
        name: 'Ulepsz Losową Broń',
        description: '+30% DMG, +1 pocisk',
        price: 100,
        emoji: '⬆️'
    }
};

class Shop {
    constructor() {
        this.availableItems = [];
        this.itemCount = 5; // Więcej opcji w sklepie
    }
    
    // Dynamiczne skalowanie cen
    calculatePrice(basePrice, player) {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        
        // Skalowanie z numerem fali (po fali 5, +15% za każdą falę)
        let waveMultiplier = 1;
        if (waveNumber > 5) {
            waveMultiplier = 1 + (waveNumber - 5) * 0.15;
        }
        
        // Skalowanie z ilością posiadanych przedmiotów (każdy przedmiot +8%)
        const itemCount = player.items ? player.items.length : 0;
        const itemMultiplier = 1 + itemCount * 0.08;
        
        // Skalowanie z ilością broni (każda broń +10%)
        const weaponCount = player.weapons ? player.weapons.length : 0;
        const weaponMultiplier = 1 + weaponCount * 0.10;
        
        // Końcowa cena (zaokrąglona do 5)
        const finalPrice = basePrice * waveMultiplier * itemMultiplier * weaponMultiplier;
        return Math.round(finalPrice / 5) * 5;
    }

    generateItems(player) {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        
        // Kategoryzacja przedmiotów
        const weapons = [];
        const items = [];
        const upgrades = [];
        
        Object.keys(SHOP_ITEMS).forEach(key => {
            const item = SHOP_ITEMS[key];
            
            // Don't offer weapon upgrade if no weapons to upgrade
            if (item.type === 'weaponUpgrade' && player.weapons.length === 0) return;
            
            if (item.type === 'weapon') weapons.push(key);
            else if (item.type === 'item') items.push(key);
            else if (item.type === 'weaponUpgrade') upgrades.push(key);
        });
        
        // Shuffle each category
        const shuffle = arr => arr.sort(() => Math.random() - 0.5);
        shuffle(weapons);
        shuffle(items);
        shuffle(upgrades);
        
        // Build shop with guaranteed variety
        this.availableItems = [];
        
        // Gwarantowane 2 bronie (lub ile jest dostępnych)
        const weaponCount = Math.min(2, weapons.length);
        for (let i = 0; i < weaponCount; i++) {
            this.availableItems.push(weapons[i]);
        }
        
        // Gwarantowane 2 przedmioty
        const itemCount = Math.min(2, items.length);
        for (let i = 0; i < itemCount; i++) {
            this.availableItems.push(items[i]);
        }
        
        // 1 losowe z: upgrade, lub dodatkowy item/weapon
        const extras = [...upgrades];
        if (weapons.length > weaponCount) extras.push(weapons[weaponCount]);
        if (items.length > itemCount) extras.push(items[itemCount]);
        shuffle(extras);
        if (extras.length > 0) {
            this.availableItems.push(extras[0]);
        }
        
        // Shuffle final list
        shuffle(this.availableItems);
    }

    renderShop(gold, player) {
        const shopEl = document.getElementById('shop');
        const itemsEl = document.getElementById('shop-items');
        
        itemsEl.innerHTML = '';
        
        // Pokaż informację o fali, broniach, przedmiotach i kasie w jednej linii
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        const infoEl = document.createElement('div');
        infoEl.className = 'shop-info';
        infoEl.innerHTML = `<small>Fala ${waveNumber} | Bronie: ${player.weapons.length}/${player.maxWeapons} | Przedmioty: ${player.items ? player.items.length : 0} | <span style="color: #ffd700">💰 ${gold}</span></small>`;
        itemsEl.appendChild(infoEl);
        
        this.availableItems.forEach((itemKey, index) => {
            const item = SHOP_ITEMS[itemKey];
            const currentPrice = this.calculatePrice(item.price, player);
            const canAfford = gold >= currentPrice;
            
            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${canAfford ? '' : 'disabled'}`;
            
            itemEl.innerHTML = `
                <div style="font-size: 24px">${item.emoji}</div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="price">💰 ${currentPrice}</div>
            `;
            
            if (canAfford) {
                itemEl.onclick = () => this.buyItem(itemKey, player, currentPrice);
            }
            
            itemsEl.appendChild(itemEl);
        });
        
        shopEl.classList.remove('hidden');
    }

    buyItem(itemKey, player, currentPrice = null) {
        const item = SHOP_ITEMS[itemKey];
        const price = currentPrice || this.calculatePrice(item.price, player);
        
        if (window.game.gold < price) {
            if (typeof audio !== 'undefined') audio.error();
            return;
        }
        
        window.game.gold -= price;
        if (typeof audio !== 'undefined') audio.purchase();
        
        switch (item.type) {
            case 'weapon':
                // Sprawdź czy gracz ma pełne sloty
                if (player.weapons.length >= player.maxWeapons) {
                    // Upgrade losowej broni tego samego typu
                    const sameTypeWeapons = player.weapons.filter(w => w.type === item.weaponType);
                    if (sameTypeWeapons.length > 0) {
                        // Wybierz losową broń tego typu
                        const randomWeapon = sameTypeWeapons[Math.floor(Math.random() * sameTypeWeapons.length)];
                        randomWeapon.upgrade();
                        
                        // Pokaż komunikat o upgrade
                        if (window.game && window.game.showNotification) {
                            window.game.showNotification(`⬆️ ${item.name} +${randomWeapon.level}`);
                        }
                    } else {
                        // Nie ma broni tego typu - upgrade losową inną
                        const randomWeapon = player.weapons[Math.floor(Math.random() * player.weapons.length)];
                        randomWeapon.upgrade();
                        
                        if (window.game && window.game.showNotification) {
                            window.game.showNotification(`⬆️ ${randomWeapon.name} +${randomWeapon.level}`);
                        }
                    }
                } else {
                    // Dodaj nową broń
                    player.addWeapon(item.weaponType);
                }
                break;
                
            case 'item':
                // Dodaj przedmiot do inventory
                player.addItem(itemKey);
                // Aplikuj efekty
                for (const [stat, value] of Object.entries(item.effect)) {
                    if (stat === 'maxHp') {
                        player.maxHp += value;
                        player.hp += value; // Też lecz
                    } else if (player[stat] !== undefined) {
                        player[stat] += value;
                    }
                }
                break;
                
            case 'weaponUpgrade':
                // Ulepsz losową broń
                if (player.weapons.length > 0) {
                    const randomWeapon = player.weapons[Math.floor(Math.random() * player.weapons.length)];
                    randomWeapon.upgrade();
                }
                break;
                
            case 'heal':
                if (item.value === 9999) {
                    player.hp = player.maxHp;
                } else {
                    player.heal(item.value);
                }
                break;
        }
        
        // Remove bought item and regenerate
        this.availableItems = this.availableItems.filter(k => k !== itemKey);
        this.renderShop(window.game.gold, player);
        window.game.updateHUD();
    }

    hideShop() {
        document.getElementById('shop').classList.add('hidden');
    }
}
