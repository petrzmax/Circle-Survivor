# 🎮 Brotato-like Game - Plan MVP

## 📋 Podsumowanie projektu
- **Typ:** Przeglądarkowa gra arena survival
- **Tech stack:** Vanilla JavaScript + HTML5 Canvas (najszybsze)
- **Czas:** MVP ~10 minut kodowania
- **Grafika:** Proste kształty geometryczne (później pixel art)

---

## 🎯 Core Mechanics (MVP)

### 1. Gracz
- Kółko/kwadrat sterowany WASD
- Auto-strzelanie w najbliższego wroga
- HP bar
- Zbieranie XP i złota

### 2. Wrogowie
- Proste kółka w różnych kolorach
- Podążają za graczem
- Różne typy: szybki/wolny, słaby/mocny
- Spawnują się falami

### 3. System fal
- Fala trwa 30-60 sekund
- Każda fala = więcej/silniejszych wrogów
- Między falami = SKLEP

### 4. Bronie (auto-fire)
- Gracz może mieć do 6 broni naraz
- Każda broń strzela niezależnie
- Typy: pistolet, shotgun, sniper, SMG

### 5. Sklep między falami
- Kupowanie broni
- Kupowanie statystyk
- Losowe przedmioty do wyboru (jak w Brotato)

### 6. Statystyki
- Max HP
- Szybkość ruchu
- Obrażenia
- Attack speed
- Pickup range

---

## 📁 Struktura plików

```
giera/
├── index.html          # Główny plik HTML
├── style.css           # Minimalne style
├── js/
│   ├── game.js         # Główna pętla gry
│   ├── player.js       # Klasa gracza
│   ├── enemy.js        # Klasa wroga
│   ├── weapon.js       # System broni
│   ├── shop.js         # Sklep między falami
│   ├── wave.js         # Zarządzanie falami
│   └── utils.js        # Pomocnicze funkcje
└── plan.md             # Ten plik
```

---

## 🚀 Kolejność implementacji (10 min MVP)

### Faza 1: Podstawy (3 min)
- [ ] HTML + Canvas setup
- [ ] Game loop (requestAnimationFrame)
- [ ] Gracz: render + ruch WASD

### Faza 2: Combat (3 min)
- [ ] Spawn wrogów
- [ ] Wrogowie podążają za graczem
- [ ] Auto-strzelanie (1 broń)
- [ ] Kolizje: pociski-wrogowie, wrogowie-gracz

### Faza 3: Progresja (2 min)
- [ ] XP drops z wrogów
- [ ] System fal (timer)
- [ ] HP gracza + game over

### Faza 4: Sklep (2 min)
- [ ] Przerwa między falami
- [ ] Prosty UI sklepu
- [ ] Kupowanie: broń + staty

---

## 🎨 Wizualizacja (kształty geometryczne)

| Element | Kształt | Kolor |
|---------|---------|-------|
| Gracz | Kwadrat | 🟦 Niebieski |
| Wróg zwykły | Kółko | 🔴 Czerwony |
| Wróg szybki | Mały trójkąt | 🟠 Pomarańczowy |
| Wróg tank | Duże kółko | 🟣 Fioletowy |
| Pocisk gracza | Małe kółko | 🟡 Żółty |
| XP | Mały diament | 🟢 Zielony |
| Złoto | Mały kwadrat | 🟡 Złoty |

---

## ⚔️ Bronie (szczegóły)

| Broń | Fire Rate | Damage | Pociski | Cena |
|------|-----------|--------|---------|------|
| Pistol | 2/s | 10 | 1 | Start |
| SMG | 5/s | 5 | 1 | 50 |
| Shotgun | 1/s | 8 | 5 | 80 |
| Sniper | 0.5/s | 50 | 1 (przenika) | 100 |
| Laser | Ciągły | 3/tick | Beam | 120 |

---

## 📊 Balans fal

| Fala | Czas | Ilość wrogów | Typy |
|------|------|--------------|------|
| 1 | 30s | 10 | Zwykły |
| 2 | 30s | 15 | Zwykły, Szybki |
| 3 | 45s | 20 | Zwykły, Szybki, Tank |
| 4 | 45s | 30 | Mix |
| 5+ | 60s | 40+ | Mix + Boss? |

---

## 🛒 Sklep - przedmioty

### Bronie
- Nowe bronie do kupienia
- Ulepszenia istniejących broni

### Statystyki (+10 każda)
| Stat | Efekt | Cena |
|------|-------|------|
| Max HP | +20 HP | 25 |
| Speed | +10% ruchu | 30 |
| Damage | +15% dmg | 40 |
| Attack Speed | +10% AS | 35 |
| Pickup Range | +20 range | 20 |

---

## 🎮 Sterowanie

- **WASD** - Ruch
- **Mysz** - Celowanie (opcjonalnie, domyślnie auto-aim)
- **ESC** - Pauza
- **1-6** - Wybór aktywnej broni (opcjonalnie)

---

## ✅ Definition of Done (MVP)

1. ✅ Gracz porusza się po arenie
2. ✅ Wrogowie spawnują się i atakują
3. ✅ Auto-strzelanie działa
4. ✅ Można zbierać XP/złoto
5. ✅ Fale się zmieniają
6. ✅ Sklep pozwala kupować
7. ✅ Game Over gdy HP = 0

---

## 🔮 Nice-to-have (po MVP)

- [ ] Pixel art zamiast kształtów
- [ ] Więcej broni
- [ ] Wybór postaci na start
- [ ] Efekty dźwiękowe
- [ ] Particle effects
- [ ] Leaderboard (localStorage)
- [ ] Mobile support (touch)

---

## 💡 Notatki techniczne

### Canvas setup
```javascript
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
```

### Game loop pattern
```javascript
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}
```

### Auto-aim logic
```javascript
function findNearestEnemy(player, enemies) {
    return enemies.reduce((nearest, enemy) => {
        const dist = distance(player, enemy);
        return dist < nearest.dist ? {enemy, dist} : nearest;
    }, {enemy: null, dist: Infinity}).enemy;
}
```

---

**Gotowy do kodowania! 🚀**
