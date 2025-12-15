# Plan Refaktoryzacji Circle-Survivor

## ✅ Zakończone

### Faza A: Wydzielenie konfiguracji i encji

#### Krok 1: Konfiguracje → `js/config/`
- [x] `weapons-config.js` ← WEAPON_TYPES z weapon.js (~210 linii)
- [x] `enemies-config.js` ← ENEMY_TYPES + BOSS_NAME_* z enemy.js (~180 linii)
- [x] `shop-items-config.js` ← SHOP_ITEMS + CHARACTER_TYPES z shop.js (~320 linii)

#### Krok 2: Encje → `js/entities/`
- [x] `bullet.js` ← Bullet class z weapon.js
- [x] `enemy-bullet.js` ← EnemyBullet class z enemy.js
- [x] `pickup.js` ← Pickup class z enemy.js

#### Krok 3: Systemy → `js/systems/`
- [x] `collision-system.js` ← logika kolizji z game.js
- [x] `effects-system.js` ← eksplozje, shockwave, particles z game.js
- [x] `hud.js` ← updateHUD(), renderBossHealthBar() z game.js

### Faza B: Rozbicie Game.js

#### Krok 4: Wydzielenie z Game class
- [x] `input-handler.js` ← setupEventListeners(), obsługa klawiszy
- [x] `weapon-renderer.js` ← renderowanie ikon broni z player.js (~150 linii)

---

## 🔄 Do zrobienia - Faza C: Dalsze czyszczenie

### Krok 5: Combat System → `js/systems/combat-system.js`
Wydzielenie logiki walki z game.js (~100 linii):
- [ ] `handleExplosion()` - obsługa eksplozji od broni (bazooka, miny, nuke, holyGrenade, banana)
- [ ] `handleChainEffect()` - efekt łańcucha (kusza)
- [ ] `spawnMiniBananas()` - spawn mini bananów po wybuchu głównego banana

### Krok 6: Leaderboard UI → `js/systems/leaderboard-ui.js`
Wydzielenie obsługi tablicy wyników z game.js (~80 linii):
- [ ] `submitScore()` - wysyłanie wyniku
- [ ] `showLeaderboard()`, `switchLeaderboardTab()` - game over screen
- [ ] `showMenuLeaderboard()`, `switchMenuLeaderboardTab()` - menu screen
- [ ] `openMenuLeaderboard()`, `closeMenuLeaderboard()` - nawigacja

### Krok 7: Enemy Spawner → `js/systems/enemy-spawner.js`
Wydzielenie logiki dropów z game.js (~60 linii):
- [ ] `handleEnemyDeath()` - spawn złota, HP, efekty śmierci
- [ ] Logika Splitter (spawn mniejszych wrogów)
- [ ] Logika Exploder (obrażenia przy śmierci)

### Krok 8 (opcjonalny): Game Renderer → `js/systems/game-renderer.js`
Wydzielenie renderowania z game.js (~50 linii):
- [ ] `render()` - główna metoda renderowania
- [ ] Renderowanie tła/siatki
- [ ] Koordynacja renderowania wszystkich encji

### Krok 9 (opcjonalny): Enemy Renderer → wydzielenie z enemy.js
Wydzielenie renderowania wroga (~80 linii):
- [ ] `render()` z Enemy class - korona bossa, oczy, HP bar
- [ ] Efekty specjalne (ghost, exploder glow)

---

## 📊 Statystyki po Fazie B

| Plik | Linie przed | Linie po | Zmiana |
|------|-------------|----------|--------|
| game.js | ~1370 | ~912 | -458 |
| player.js | ~505 | ~350 | -155 |
| weapon.js | ~700 | ~195 | -505 |
| enemy.js | ~670 | ~270 | -400 |
| shop.js | ~700 | ~299 | -401 |

**Nowe pliki:**
- `js/config/` - 3 pliki (~710 linii)
- `js/entities/` - 3 pliki (~200 linii)
- `js/systems/` - 5 plików (~450 linii)

---

## 📁 Docelowa struktura projektu

```
js/
├── config/
│   ├── weapons-config.js      ✅
│   ├── enemies-config.js      ✅
│   └── shop-items-config.js   ✅
├── entities/
│   ├── bullet.js              ✅
│   ├── enemy-bullet.js        ✅
│   └── pickup.js              ✅
├── systems/
│   ├── collision-system.js    ✅
│   ├── effects-system.js      ✅
│   ├── hud.js                 ✅
│   ├── input-handler.js       ✅
│   ├── weapon-renderer.js     ✅
│   ├── combat-system.js       🔄 Krok 5
│   ├── leaderboard-ui.js      🔄 Krok 6
│   └── enemy-spawner.js       🔄 Krok 7
├── audio.js
├── enemy.js
├── game.js
├── leaderboard.js
├── player.js
├── shop.js
├── utils.js
├── version.js
├── wave.js
└── weapon.js
```

---

## 🎯 Priorytety

1. **Krok 5 (combat-system.js)** - największa wartość, czyści główną pętlę gry
2. **Krok 6 (leaderboard-ui.js)** - czysta separacja UI od logiki gry
3. **Krok 7 (enemy-spawner.js)** - logika dropów i spawnu

Kroki 8-9 są opcjonalne i mogą być wykonane później.

---

## 📝 Notatki

- Bundler (Vite/Webpack) - nie jest konieczny na tym etapie
- TypeScript - rozważyć po zakończeniu refaktoryzacji struktury
- Object Pooling dla Bullet/Pickup - rozważyć jeśli pojawią się problemy z FPS
- State Pattern dla scen - rozważyć w przyszłości (menu, playing, shop, gameover)
