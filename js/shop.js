// Shop system
// SHOP_ITEMS moved to js/config/shop-items-config.js

class Shop {
    constructor() {
        this.availableItems = [];
        this.itemCount = 5; // More options in shop
        this.rerollCount = 0; // How many times rerolled in this visit
    }
    
    // Calculate reroll price
    getRerollPrice() {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        const basePrice = GAME_BALANCE.economy.reroll.baseCost;
        // Price = base * (1 + wave*perWave) * (1 + reroll*perReroll)
        const waveMultiplier = 1 + (waveNumber - 1) * GAME_BALANCE.economy.reroll.perWave;
        const rerollMultiplier = 1 + this.rerollCount * GAME_BALANCE.economy.reroll.perReroll;
        return Math.round(basePrice * waveMultiplier * rerollMultiplier / 5) * 5;
    }
    
    // Reroll items in shop
    rerollItems(player) {
        const price = this.getRerollPrice();
        
        if (window.game.gold < price) {
            if (typeof audio !== 'undefined') audio.error();
            return;
        }
        
        window.game.gold -= price;
        this.rerollCount++;
        
        if (typeof audio !== 'undefined') audio.purchase();
        
        // Generate new items
        this.generateItems(player);
        this.renderShop(window.game.gold, player);
        window.game.updateHUD();
    }
    
    // Dynamic price scaling
    calculatePrice(basePrice, player) {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        
        // Scaling with wave number (after startWave, +perWave% per wave)
        let waveMultiplier = 1;
        if (waveNumber > GAME_BALANCE.economy.priceScale.startWave) {
            waveMultiplier = 1 + (waveNumber - GAME_BALANCE.economy.priceScale.startWave) * GAME_BALANCE.economy.priceScale.perWave;
        }
        
        // Scaling with owned items (+perItem% per item)
        const itemCount = player.items ? player.items.length : 0;
        const itemMultiplier = 1 + itemCount * GAME_BALANCE.economy.priceScale.perItem;
        
        // Scaling with weapon count (+perWeapon% per weapon)
        const weaponCount = player.weapons ? player.weapons.length : 0;
        const weaponMultiplier = 1 + weaponCount * GAME_BALANCE.economy.priceScale.perWeapon;
        
        // Final price (rounded to 5)
        const finalPrice = basePrice * waveMultiplier * itemMultiplier * weaponMultiplier;
        return Math.round(finalPrice / 5) * 5;
    }

    generateItems(player) {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        
        // Item categorization
        const weapons = [];
        const items = [];
        const upgrades = [];
        
        Object.keys(SHOP_ITEMS).forEach(key => {
            const item = SHOP_ITEMS[key];
            
            // Don't offer weapon upgrade if no weapons to upgrade
            if (item.type === 'weaponUpgrade' && player.weapons.length === 0) return;
            
            // Don't offer weapon bonus if no weapons
            if (item.type === 'weaponBonus' && player.weapons.length === 0) return;
            
            if (item.type === 'weapon') weapons.push(key);
            else if (item.type === 'item' || item.type === 'weaponBonus') items.push(key);
            else if (item.type === 'weaponUpgrade') upgrades.push(key);
        });
        
        // Shuffle each category
        const shuffle = arr => arr.sort(() => Math.random() - 0.5);
        shuffle(weapons);
        shuffle(items);
        shuffle(upgrades);
        
        // Build shop with guaranteed variety
        this.availableItems = [];
        
        // Guaranteed 2 weapons (or as many as available)
        const weaponCount = Math.min(2, weapons.length);
        for (let i = 0; i < weaponCount; i++) {
            this.availableItems.push(weapons[i]);
        }
        
        // Guaranteed 2 items
        const itemCount = Math.min(2, items.length);
        for (let i = 0; i < itemCount; i++) {
            this.availableItems.push(items[i]);
        }
        
        // 1 random from: upgrade, or additional item/weapon
        const extras = [...upgrades];
        if (weapons.length > weaponCount) extras.push(weapons[weaponCount]);
        if (items.length > itemCount) extras.push(items[itemCount]);
        shuffle(extras);
        if (extras.length > 0) {
            this.availableItems.push(extras[0]);
        }
        
        // Shuffle final list
        shuffle(this.availableItems);
        
        // Reset reroll count for new shop (only on first generateItems)
        // Reroll count is reset in openShop
    }
    
    // Reset reroll on shop open
    resetReroll() {
        this.rerollCount = 0;
    }

    renderShop(gold, player) {
        const shopEl = document.getElementById('shop');
        const itemsEl = document.getElementById('shop-items');
        
        itemsEl.innerHTML = '';
        
        // Show info about wave, weapons, items and gold in one line
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        const infoEl = document.createElement('div');
        infoEl.className = 'shop-info';
        infoEl.innerHTML = `<small>Fala ${waveNumber} | Bronie: ${player.weapons.length}/${player.maxWeapons} | Przedmioty: ${player.items ? player.items.length : 0} | <span style="color: #ffd700">💰 ${gold}</span></small>`;
        itemsEl.appendChild(infoEl);
        
        this.availableItems.forEach((itemKey, index) => {
            const item = SHOP_ITEMS[itemKey];
            const currentPrice = this.calculatePrice(item.price, player);
            const canAfford = gold >= currentPrice;
            
            // Check if weapon is locked (full slots and don't have this weapon)
            let isWeaponLocked = false;
            if (item.type === 'weapon') {
                const hasThisWeapon = player.weapons.some(w => w.type === item.weaponType);
                if (player.weapons.length >= player.maxWeapons && !hasThisWeapon) {
                    isWeaponLocked = true;
                }
            }
            
            const canBuy = canAfford && !isWeaponLocked;
            
            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${canBuy ? '' : 'disabled'}`;
            
            // Show lock info
            let extraInfo = '';;
            if (isWeaponLocked) {
                extraInfo = '<div style="color: #ff6b6b; font-size: 10px">🔒 Pełne sloty</div>';
            } else if (item.type === 'weapon' && player.weapons.length >= player.maxWeapons && player.weapons.some(w => w.type === item.weaponType)) {
                // Upgrade only when you have full slots AND already have this weapon
                extraInfo = '<div style="color: #4ecdc4; font-size: 10px">⬆️ Upgrade</div>';
            }
            
            itemEl.innerHTML = `
                <div style="font-size: 24px">${item.emoji}</div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                ${extraInfo}
                <div class="price">💰 ${currentPrice}</div>
            `;
            
            if (canBuy) {
                itemEl.onclick = () => this.buyItem(itemKey, player, currentPrice);
            }
            
            itemsEl.appendChild(itemEl);
        });
        
        // Reroll button
        const rerollPrice = this.getRerollPrice();
        const canReroll = gold >= rerollPrice;
        
        const rerollEl = document.createElement('div');
        rerollEl.className = `shop-item reroll-btn ${canReroll ? '' : 'disabled'}`;
        rerollEl.innerHTML = `
            <div style="font-size: 24px">🎲</div>
            <h3>Losuj</h3>
            <p>Nowe przedmioty</p>
            <div class="price">💰 ${rerollPrice}</div>
        `;
        
        if (canReroll) {
            rerollEl.onclick = () => this.rerollItems(player);
        }
        
        itemsEl.appendChild(rerollEl);
        
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
                // Check if player has full slots
                if (player.weapons.length >= player.maxWeapons) {
                    // Upgrade random weapon of the same type
                    const sameTypeWeapons = player.weapons.filter(w => w.type === item.weaponType);
                    if (sameTypeWeapons.length > 0) {
                        // Pick random weapon of this type
                        const randomWeapon = sameTypeWeapons[Math.floor(Math.random() * sameTypeWeapons.length)];
                        randomWeapon.upgrade();
                        
                        // Show upgrade notification
                        if (window.game && window.game.showNotification) {
                            window.game.showNotification(`⬆️ ${item.name} +${randomWeapon.level}`);
                        }
                    } else {
                        // No weapon of this type - refund (shouldn't happen)
                        window.game.gold += price;
                        if (typeof audio !== 'undefined') audio.error();
                        return;
                    }
                } else {
                    // Add new weapon
                    player.addWeapon(item.weaponType);
                }
                break;
                
            case 'weaponBonus':
                // Bonus to random weapon (e.g., multishot)
                if (player.weapons.length === 0) {
                    window.game.gold += price;
                    if (typeof audio !== 'undefined') audio.error();
                    return;
                }
                // Add item to inventory
                player.addItem(itemKey);
                // Pick random weapon
                const randomWeapon = player.weapons[Math.floor(Math.random() * player.weapons.length)];
                // Apply bonus to weapon
                if (item.bonusType && randomWeapon[item.bonusType] !== undefined) {
                    randomWeapon[item.bonusType] += item.bonusValue;
                }
                // Show notification
                if (window.game && window.game.showNotification) {
                    window.game.showNotification(`🎯 ${randomWeapon.name} +${item.bonusValue} pocisk!`);
                }
                break;
                
            case 'item':
                // Add item to inventory
                player.addItem(itemKey);
                // Apply effects
                for (const [stat, value] of Object.entries(item.effect)) {
                    if (stat === 'maxHp') {
                        player.maxHp += value;
                        player.hp += value; // Also heal
                    } else if (player[stat] !== undefined) {
                        player[stat] += value;
                    }
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
