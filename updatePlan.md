# Plan Aktualizacji - Circle Survivor

## Zmiany do implementacji

---

### 1. Mini banany - losowa odległość i prędkość
**Plik:** js/game.js - `spawnMiniBananas()`

Randomizuj dla każdego mini banana osobno:
- **Prędkość:** losowo 6-10 (obecnie stałe 8)
- **Dystans:** losowo 60-100px (obecnie stałe 80)

---

### 2. Skalowanie wrogów - krzywa wykładnicza
**Plik:** js/wave.js

Zmień formułę z liniowej na wykładniczą: `1.02^(wave-5)`

| Fala | Stare (liniowe) | Nowe (wykładnicze) |
|------|-----------------|-------------------|
| 10   | ×1.10           | ×1.10             |
| 15   | ×1.20           | ×1.22             |
| 25   | ×1.40           | ×1.49             |
| 50   | ×1.90           | ×2.44             |

---

### 3. Boss collision damage ×3
**Plik:** js/game.js - sprawdzanie kolizji gracza z wrogami

Jeśli wróg to boss, pomnóż obrażenia przez 3.

---

### 4. Loading indicator dla globalnych wyników
**Plik:** js/leaderboard.js

- Przed pobieraniem wyników pokaż "Ładowanie..."
- Po załadowaniu usuń komunikat i wyświetl wyniki

---

### 5. Zmniejsz knockback SMG
**Plik:** js/weapon.js - definicja SMG

Dodaj `knockbackMultiplier: 0.4`  
(Obecnie brak = domyślne 1.0, minigun ma 0.3)

---

### 6. Skróć czas kasy do 3s
**Plik:** js/game.js - klasa `Pickup`

Zmień lifetime dla gold z 4000ms na 3000ms.

---

## Kolejność implementacji

1. **[Łatwe]** Knockback SMG
2. **[Łatwe]** Czas kasy
3. **[Łatwe]** Skalowanie wykładnicze
4. **[Łatwe]** Boss damage ×3
5. **[Średnie]** Mini banany losowe
6. **[Średnie]** Loading indicator
