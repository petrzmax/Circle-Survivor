# Plan Aktualizacji - Circle Survivor

## 0. Kategoryzacja broni

**Plik:** js/weapon.js - `WEAPON_TYPES`

Dodaj właściwość `weaponCategory` do każdej broni:

| Kategoria | Bronie | Opis |
|-----------|--------|------|
| `gun` | pistol, smg, shotgun, sniper, laser, minigun, crossbow | Broń palna - pociski lecą prosto, znikają poza ekranem |
| `grenade` | holyGrenade, banana | Granaty - rzucane, hamują pod koniec lotu, wybuchają po dystansie |
| `rocket` | bazooka, nuke | Rakiety - lecą prosto do celu, wybuchają przy trafieniu |
| `melee` | sword, scythe | Bliski zasięg - krótki dystans, szybko znikają |
| `special` | flamethrower, mines | Specjalne - unikalne zachowanie |

**Zmiany:**
```javascript
// Przykład dla holyGrenade:
holyGrenade: {
    ...
    weaponCategory: 'grenade',
    explosiveRange: 275  // tylko dla granatów
}

// Przykład dla bazooka:
bazooka: {
    ...
    weaponCategory: 'rocket'
    // brak explosiveRange - leci do trafiania
}
```

---

## 1. Ulepszenia Bossów

### 1.1 Więcej ataków bossa

**Plik:** js/enemy.js - metoda `tryShoot()`

**Nowe ataki:**
- **Spread** - 3-5 pocisków w łuku 45-60°
- **Shockwave** - atak obszarowy wokół bossa, zadaje obrażenia w promieniu

| Boss | Ataki |
|------|-------|
| bossBasic | single, spread |
| bossSwarm | single, spread |
| bossTank | single, shockwave |
| bossSpeed | single, spread |
| bossExploder | spread, shockwave |
| bossGhost | single, spread |

**Zmiany:**
1. Dodaj `attackPatterns: ['single', 'spread']` lub `['single', 'shockwave']` do konfiguracji bossów
2. Zmień `tryShoot()` na `tryAttack()` - losuje wzorzec ataku
3. Dla `spread`: zwróć tablicę pocisków pod różnymi kątami (3-5 pocisków w wachlarzu)
4. Dla `shockwave`: zwróć obiekt `{ type: 'shockwave', x, y, radius, damage }`
5. W js/game.js obsłuż shockwave - renderuj rozszerzający się okrąg, zadaj DMG graczowi w zasięgu

### 1.2 Częstsze strzelanie

| Boss | Stary fireRate | Nowy fireRate |
|------|---------------|---------------|
| bossBasic | 2000ms | **1300ms** |
| bossSwarm | 1500ms | **1000ms** |
| bossTank | 3000ms | **2000ms** |
| bossSpeed | 800ms | **550ms** |
| bossExploder | 2500ms | **1600ms** |
| bossGhost | 1800ms | **1200ms** |

---

## 2. Duży pasek HP bossa na górze ekranu

**Plik:** js/game.js - nowa metoda `renderBossHealthBar()`

- Pozycja: góra ekranu, wycentrowany
- Szerokość: ~60% canvas (480px)
- Wysokość: 25-30px
- Nazwa + emoji bossa nad paskiem
- Gradient: zielony → żółty → czerwony

```
      👹 Wielki Niszczyciel
[████████████████░░░░░░░░] 75%
```

---

## 3. Granaty - wybuch po dystansie z płynnym hamowaniem

**Plik:** js/weapon.js + js/game.js

**Dotyczy tylko kategorii `grenade`:** holyGrenade, banana

**Mechanika lotu granatów:**
1. Granat leci normalną prędkością przez 70% dystansu
2. Ostatnie 30% dystansu - płynne hamowanie (ease-out)
3. Gdy prędkość spadnie do ~0 → wybuch

**Rakiety (bazooka, nuke) - BEZ ZMIAN:**
- Lecą prosto do celu z pełną prędkością
- Wybuchają tylko przy trafieniu wroga

**Zmiany w js/weapon.js:**
1. Dodaj `explosiveRange` tylko do granatów
2. W klasie `Bullet` w `update()`:
   ```javascript
   // Tylko dla granatów (weaponCategory === 'grenade')
   if (this.weaponCategory === 'grenade' && this.explosiveRange) {
       const progress = this.distanceTraveled / this.explosiveRange;
       if (progress > 0.7) {
           // Ease-out: prędkość spada od 100% do 0%
           const slowdownProgress = (progress - 0.7) / 0.3;
           const speedMultiplier = 1 - slowdownProgress;
           this.vx *= speedMultiplier;
           this.vy *= speedMultiplier;
       }
       if (progress >= 1) {
           this.shouldExplodeOnExpire = true;
       }
   }
   ```
3. W `shouldExpire()`: sprawdź `shouldExplodeOnExpire`

**Zmiany w js/game.js:**
- Jeśli pocisk expiruje z `shouldExplodeOnExpire` → wywołaj `handleExplosion()`

| Broń | Kategoria | explosiveRange |
|------|-----------|---------------|
| holyGrenade | grenade | 275 |
| banana | grenade | 235 |
| bazooka | rocket | - (brak) |
| nuke | rocket | - (brak) |

---

## 4. Banan - rozpad na mniejsze

**Mechanika:**
1. Główny banan wybucha (na kolizję lub po dystansie)
2. Spawni 4-6 mini bananów w losowych kierunkach
3. Mini banany lecą 60-100px i wybuchają
4. Mini: 40% DMG, 50% promienia eksplozji

**Zmiany:**
1. Dodaj wewnętrzny typ `minibanana`:
   ```javascript
   minibanana: {
       damage: 16,           // 40% z 40
       explosionRadius: 45,  // 50% z 90
       bulletSpeed: 8,
       explosiveRange: 80,   // krótki lot
       explosive: true,
       isBanana: true,
       bulletRadius: 6
   }
   ```
2. W `handleExplosion()` dla banana (gdy `!bullet.isMini`):
   - Wywołaj `spawnMiniBananas(x, y, 4 + Math.floor(Math.random() * 3))`
3. Dodaj metodę `spawnMiniBananas(x, y, count)`:
   - Dla każdego: losowy kąt 0-360°
   - Stwórz pocisk typu minibanana z `isMini = true`

---

## 5. Skalowanie wrogów od fali 5

**Plik:** js/wave.js - `spawnEnemy()`

**Formuła:** +2% HP i DMG na falę (od fali 5)
- Fala 5: ×1.00
- Fala 10: ×1.10
- Fala 20: ×1.30
- Fala 50: ×1.90

```javascript
const scalingWave = Math.max(0, this.waveNumber - 5);
const multiplier = 1 + (scalingWave * 0.02);
enemy.hp = Math.round(enemy.hp * multiplier);
enemy.maxHp = enemy.hp;
enemy.damage = Math.round(enemy.damage * multiplier);
```

NIE skaluj prędkości!

---

## Kolejność implementacji

1. **[Łatwe]** Kategoryzacja broni (weaponCategory)
2. **[Łatwe]** Skalowanie wrogów
3. **[Łatwe]** Częstsze strzelanie bossa
4. **[Średnie]** Granaty po dystansie z hamowaniem
5. **[Średnie]** Pasek HP bossa
6. **[Średnie]** Rozpad banana
7. **[Trudne]** Nowe ataki bossa (spread + shockwave)
