// Shop system
// SHOP_ITEMS moved to js/config/shop-items-config.js

class Shop {
    constructor() {
        this.availableItems = [];
        this.itemCount = 5; // Więcej opcji w sklepie
        this.rerollCount = 0; // Ile razy przegłosowano w tej wizycie
    }
    
    // Oblicz cenę reroll
    getRerollPrice() {
        const waveNumber = window.game ? window.game.waveManager.waveNumber : 1;
        const basePrice = 15;
        // Cena = baza * (1 + fala*0.2) * (1 + reroll*0.5)
        const waveMultiplier = 1 + (waveNumber - 1) * 0.2;
        const rerollMultiplier = 1 + this.rerollCount * 0.5;
        return Math.round(basePrice * waveMultiplier * rerollMultiplier / 5) * 5;
    }
    
    // Reroll przedmiotów w sklepie
    rerollItems(player) {
        const price = this.getRerollPrice();
        
        if (window.game.gold < price) {
            if (typeof audio !== 'undefined') audio.error();
            return;
        }
        
        window.game.gold -= price;
        this.rerollCount++;
        
        if (typeof audio !== 'undefined') audio.purchase();
        
        // Generuj nowe przedmioty
        this.generateItems(player);
        this.renderShop(window.game.gold, player);
        window.game.updateHUD();
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
        
        // Reset reroll count przy nowym sklepie (tylko przy pierwszym generateItems)
        // Reroll count resetowany jest w openShop
    }
    
    // Reset reroll przy otwarciu sklepu
    resetReroll() {
        this.rerollCount = 0;
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
            
            // Sprawdź czy broń jest zablokowana (pełne sloty i nie masz tej broni)
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
            
            // Pokaż info o blokadzie
            let extraInfo = '';
            if (isWeaponLocked) {
                extraInfo = '<div style="color: #ff6b6b; font-size: 10px">🔒 Pełne sloty</div>';
            } else if (item.type === 'weapon' && player.weapons.length >= player.maxWeapons && player.weapons.some(w => w.type === item.weaponType)) {
                // Upgrade tylko gdy masz pełne sloty I masz już tę broń
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
        
        // Przycisk Reroll
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
                        // Nie ma broni tego typu - zwróć kasę (nie powinno się zdarzyć)
                        window.game.gold += price;
                        if (typeof audio !== 'undefined') audio.error();
                        return;
                    }
                } else {
                    // Dodaj nową broń
                    player.addWeapon(item.weaponType);
                }
                break;
                
            case 'weaponBonus':
                // Bonus do losowej broni (np. multishot)
                if (player.weapons.length === 0) {
                    window.game.gold += price;
                    if (typeof audio !== 'undefined') audio.error();
                    return;
                }
                // Dodaj przedmiot do inventory
                player.addItem(itemKey);
                // Wybierz losową broń
                const randomWeapon = player.weapons[Math.floor(Math.random() * player.weapons.length)];
                // Aplikuj bonus do broni
                if (item.bonusType && randomWeapon[item.bonusType] !== undefined) {
                    randomWeapon[item.bonusType] += item.bonusValue;
                }
                // Pokaż komunikat
                if (window.game && window.game.showNotification) {
                    window.game.showNotification(`🎯 ${randomWeapon.name} +${item.bonusValue} pocisk!`);
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
