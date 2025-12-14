# Plan Aktualizacji - Animacje i Poprawki

## 1. Animacje śmierci wrogów (particle burst)
**Plik:** js/game.js

### Nowy system efektów śmierci:
- Dodaj tablicę `this.deathEffects = []`
- W `handleEnemyDeath()` przed usunięciem wroga, dodaj efekt śmierci
- Każdy typ wroga ma inny kolor/styl cząsteczek:

| Typ wroga | Kolor cząsteczek | Ilość |
|-----------|------------------|-------|
| basic | #e74c3c (czerwony) | 5 |
| fast | #f39c12 (pomarańcz) | 6 |
| tank | #9b59b6 (fiolet) | 8 |
| swarm | #2ecc71 (zielony) | 3 |
| brute | #8b0000 (ciemnoczerwony) | 10 |
| ghost | rgba(255,255,255,0.6) | 6 |
| sprinter | #00ffff (cyan) | 7 |
| exploder | #ff6600 (pomarańcz) | 8 |
| splitter | #ff69b4 (różowy) | 6 |
| zigzag | #ffff00 (żółty) | 5 |

### Renderowanie:
- Cząsteczki rozlatują się na zewnątrz
- Zanikają (alpha) przez ~300ms
- Kurczą się (radius)

---

## 2. Specjalna animacja śmierci bossa
**Plik:** js/game.js

### Duży wybuch z wieloma cząsteczkami:
- W `handleEnemyDeath()` sprawdź `if (enemy.isBoss)`
- Stwórz duży efekt wybuchu:
  - 20-30 cząsteczek
  - Większy radius początkowy
  - Dłuższy czas trwania (~600ms)
  - Kolor zależny od typu bossa
  - Dodatkowe pierścienie/fale

---

## 3. Więcej złota z bossa (wizualnie)
**Plik:** js/game.js - `handleEnemyDeath()`

### Zmień drop złota dla bossów:
- Jeden duży woreczek (50% wartości) w centrum
- 6-8 małych woreczków (reszta wartości) rozrzuconych dookoła w okręgu

---

## 4. Zmień nazwę przedmiotu
**Plik:** js/shop.js

- Stara nazwa: "Wybuchowa Amunicja"
- Nowa nazwa: **"Zimna Wojna"**

---

## 5. Fix: Ujemne HP = Game Over
**Plik:** js/player.js

### Problem:
Gracz może mieć -15 HP i gra się nie kończy.

### Rozwiązanie:
W `takeDamage()` dodaj:
```javascript
this.hp = Math.max(0, this.hp - finalDamage);  // Nie pozwól na ujemne HP
```

---

## Kolejność implementacji

1. **[Łatwe]** Zmień nazwę przedmiotu na "Zimna Wojna"
2. **[Łatwe]** Fix ujemnego HP
3. **[Średnie]** Więcej złota z bossa (wizualnie)
4. **[Trudne]** System efektów śmierci wrogów
5. **[Trudne]** Specjalna animacja śmierci bossa

---

## Podsumowanie zmian

- **Śmierć wrogów**: Particle burst w kolorze wroga
- **Śmierć bossa**: Duży wybuch z wieloma cząsteczkami
- **Gold z bossa**: 1 duży + 6-8 małych woreczków (rozrzuconych)
- **"Wybuchowa Amunicja"** → **"Zimna Wojna"**
- **HP**: Nie może być ujemne, gra kończy się przy HP <= 0