## Plan: Weapon Balance & Range System

Dodanie systemu zasięgu broni, nerf miniguna oraz równomierne rozłożenie strzałów dla wielu broni tego samego typu.

### Steps

1. **Dodaj zasięgi broni w [js/weapon.js](js/weapon.js)** - każda broń otrzymuje własny `range` w `WEAPON_TYPES`:
   - minigun: 200px
   - shotgun: 180px
   - flamethrower: 150px (już ma shortRange)
   - smg: 280px
   - pistol: 350px
   - sniper: 500px
   - bazooka: 400px
   - laser: 450px
   - crossbow: 400px
   - inne: 300px (default)

2. **Zmodyfikuj targetowanie w [js/game.js](js/game.js)** - funkcja `findNearestEnemyFrom()` przyjmuje parametr `maxRange`, ignoruje wrogów poza zasięgiem

3. **Nerf miniguna w [js/weapon.js](js/weapon.js) i [js/shop.js](js/shop.js)**:
   - damage: 4 → 2
   - knockbackMultiplier: 0.3 (nowy parametr per-weapon)
   - cena: 150 → 220

4. **Rozłóż strzały równomiernie w [js/player.js](js/player.js)** - w `fireAllWeapons()` grupuj bronie po typie, każda n-ta broń dostaje offset `(n/count) * fireRate` przy inicjalizacji

5. **Dodaj przedmioty na zasięg w [js/shop.js](js/shop.js)**:
   - Nowy stat gracza: `attackRange = 1` (mnożnik)
   - "Luneta 🔭" - 80 gold, +20% attack range
   - "Celownik Laserowy 🎯" - 120 gold, +15% range, +5% crit
