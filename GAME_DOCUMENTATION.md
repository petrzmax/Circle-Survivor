# 🎮 Circle Survivor - Dokumentacja Gry

## 📋 Ogólny Opis
Circle Survivor to gra typu survivor/arena shooter stworzona w czystym JavaScript z użyciem HTML5 Canvas. Gracz walczy z falami wrogów, zbiera złoto i XP, kupuje bronie oraz przedmioty w sklepie między falami.

---

## 🎯 Mechaniki Rozgrywki

### Sterowanie
- **WASD / Strzałki** - ruch gracza
- **ESC** - menu pauzy
- Strzelanie jest automatyczne (auto-aim na najbliższego wroga)

### System Fal
- Każda fala trwa 30-50 sekund (zależnie od numeru)
- **Fala 1-2:** 30 sekund
- **Fala 3-4:** 40 sekund
- **Fala 5+:** 50 sekund
- Wrogowie spawnują się szybciej i w większych ilościach z każdą falą
- **Co 5 fal** pojawia się boss

### System Sklepu
- Po każdej fali otwiera się sklep
- 5 przedmiotów do wyboru (gwarantowane 2 bronie, 2 przedmioty, 1 losowy)
- **Dynamiczne skalowanie cen:**
  - Fale 1-5: normalne ceny
  - Po fali 5: +15% za każdą kolejną falę
  - +8% za każdy posiadany przedmiot
  - +10% za każdą posiadaną broń

---

## 🔫 Bronie (15 typów)

| Broń | Cena bazowa | Opis |
|------|-------------|------|
| **Pistol** | Start | Podstawowa broń startowa |
| **SMG** | 50 | Szybki ogień, niskie obrażenia |
| **Shotgun** | 80 | 5 pocisków na strzał |
| **Sniper** | 100 | Wysokie obrażenia, przebija wrogów |
| **Laser** | 120 | Ciągły ogień laserowy |
| **Mines** | 130 | Stawiaj pułapki za sobą |
| **Flamethrower** | 140 | Krótki zasięg, duże obrażenia |
| **Minigun** | 150 | Ekstremalnie szybki ogień |
| **Sword** | 180 | Szybkie cięcia w łuk (Miecz Kamilka) |
| **Bazooka** | 180 | Rakieta z eksplozją obszarową |
| **Scythe** | 200 | Obracająca się kosa (Kosa Kubusia) |
| **Banana** | 220 | Klasyczny banan-bomba z Worms |
| **Holy Grenade** | 250 | Błogosławiona eksplozja! |
| **Crossbow** | 280 | Przebija do 5 wrogów |
| **Nuke** | 500 | BOOM! Ogromna eksplozja nuklearna |

### Mechaniki Broni
- Bronie orbitują wokół gracza jako ikony
- Każda broń celuje niezależnie w najbliższego wroga
- Można ulepszać bronie w sklepie (+30% DMG, +1 pocisk)

---

## 👾 Wrogowie (10 typów podstawowych)

| Typ | HP | Obrażenia | Złoto | Specjalne |
|-----|-----|-----------|-------|-----------|
| **Basic** | 20 | 10 | 5 | - |
| **Fast** | 10 | 5 | 8 | Szybki |
| **Tank** | 100 | 25 | 18 | Duży, wolny |
| **Swarm** | 5 | 3 | 2 | Mały, grupowy |
| **Sprinter** | 8 | 8 | 10 | Bardzo szybki |
| **Brute** | 200 | 40 | 30 | Ogromny tank |
| **Ghost** | 15 | 15 | 12 | Półprzezroczysty |
| **Exploder** | 25 | 5 | 10 | Wybucha przy śmierci |
| **Zigzag** | 18 | 8 | 9 | Ruch zygzakiem |
| **Splitter** | 40 | 12 | 15 | Dzieli się na 3 przy śmierci |

---

## 👹 Bossy (6 typów)

Bossy pojawiają się co 5 fal. Każdy kolejny boss ma:
- +50% HP za każdą "falę bossa" (fala 5, 10, 15...)
- +25% obrażeń

| Boss | HP | Obrażenia | Złoto | Specjalne |
|------|-----|-----------|-------|-----------|
| **Boss** | 500 | 50 | 100 | Standardowy |
| **Boss Swarm** | 400 | 30 | 120 | Rozpada się na 8 swarmów |
| **Boss Tank** | 1000 | 80 | 150 | Ogromny, bardzo wolny |
| **Boss Speed** | 350 | 35 | 110 | Szybki, ruch zygzakiem |
| **Boss Exploder** | 600 | 40 | 140 | Eksplozja 150px przy śmierci |
| **Boss Ghost** | 450 | 45 | 130 | Półprzezroczysty |

### Generator Nazw Bossów
Losowa kombinacja z 20 prefiksów i 20 sufiksów, np.:
- "Kieł Beredy"
- "Władca Chaosu"
- "Miłośnik Biznesu"
- "Niszczyciel Koszmaru"

---

## 🛡️ Statystyki Gracza

| Statystyka | Bazowa | Opis |
|------------|--------|------|
| **HP** | 100 | Punkty życia |
| **Armor** | 0 | Redukcja obrażeń: armor/(armor+100) |
| **Damage Multiplier** | 1.0 | Mnożnik obrażeń wszystkich broni |
| **Crit Chance** | 5% | Szansa na krytyczne trafienie |
| **Crit Damage** | 150% | Mnożnik obrażeń krytycznych |
| **Lifesteal** | 0% | % obrażeń zwracane jako HP |
| **Knockback** | 1.0 | Mnożnik odrzutu wrogów |
| **Dodge** | 0% | Szansa na unik |
| **Thorns** | 0 | Obrażenia odbite przy kontakcie |
| **Regen** | 0 | HP regenerowane na sekundę |
| **Luck** | 0% | Bonus do dropów |
| **XP Multiplier** | 1.0 | Mnożnik zdobywanego XP |
| **Gold Multiplier** | 1.0 | Mnożnik zdobywanego złota |
| **Attack Speed** | 1.0 | Mnożnik szybkości ataku |
| **Explosion Radius** | 1.0 | Mnożnik zasięgu eksplozji |
| **Pierce** | 0 | Dodatkowe przebicia pocisków |
| **Projectile Count** | 0 | Dodatkowe pociski |
| **Pickup Range** | 50 | Zasięg zbierania dropów |
| **Speed** | 4.0 | Szybkość ruchu |

---

## 🛒 Przedmioty w Sklepie (25 typów)

### Defensywne
| Przedmiot | Cena | Efekt |
|-----------|------|-------|
| Żelazna Zbroja 🛡️ | 60 | +15 Pancerza |
| Płyta Tytanowa 🔰 | 120 | +30 Pancerza |
| Peleryna Uniku 🧥 | 80 | +8% Dodge |
| Kolczuga Cierni 🌵 | 90 | +10 Thorns |
| Pojemnik na Serce 💖 | 100 | +50 Max HP |
| Pierścień Regeneracji 💍 | 85 | +2 HP/s |

### Ofensywne
| Przedmiot | Cena | Efekt |
|-----------|------|-------|
| Klejnot Mocy 💎 | 70 | +20% DMG |
| Rękawice Krytyka 🧤 | 75 | +10% Crit Chance |
| Sztylet Zabójcy 🗡️ | 90 | +50% Crit Damage |
| Kieł Wampira 🦷 | 110 | +5% Lifesteal |
| Wybuchowa Amunicja 💥 | 95 | +25% Explosion Radius |
| Multishot 🎯 | 150 | +1 Pocisk |
| Przebijające Strzały ➡️ | 100 | +2 Pierce |
| Kij Bejsbolowy Byczka 🏏 | 120 | +100% Knockback |

### Utility
| Przedmiot | Cena | Efekt |
|-----------|------|-------|
| Buty Szybkości 👢 | 55 | +15% Speed |
| Magnes 🧲 | 40 | +40 Pickup Range |
| Czterolistna Koniczyna 🍀 | 65 | +15% Luck |
| Księga Mądrości 📚 | 80 | +25% XP |
| Sakwa Skąpca 💰 | 70 | +25% Gold |
| Kryształ Furii ⚡ | 85 | +15% Attack Speed |
| Korona Króla 👑 | 200 | +10% do wszystkiego |

### Legendarne
| Przedmiot | Cena | Efekt |
|-----------|------|-------|
| Bolid Kubicy 🏎️ | 300 | +50% Speed, +20% Dodge |
| Kielich Alicji 🏆 | 280 | +10% Lifesteal, +30 HP, +2 Regen |
| Korona Podróżnika 🗺️ | 250 | +50% XP, +50% Gold, +25% Luck |
| Kierbce Wierzbickiego 🥊 | 350 | +40% DMG, +2 Pociski, +20% Crit |

### Inne
| Przedmiot | Cena | Efekt |
|-----------|------|-------|
| Ulepsz Broń ⬆️ | 100 | +30% DMG losowej broni, +1 pocisk |
| Leczenie 💊 | 30 | +50 HP |
| Pełne Leczenie 💉 | 80 | 100% HP |

---

## 🔊 System Audio

Gra używa Web Audio API do proceduralnego generowania dźwięków:
- Strzały różnych broni
- Eksplozje (małe, duże, nuklearne)
- Trafienia gracza i wrogów
- Śmierć wrogów
- Zbieranie dropów (XP, złoto, HP)
- Zakupy w sklepie
- Unik (dodge)
- Ciernie (thorns)
- Start fali
- Błędy

Przycisk włączania/wyłączania dźwięku znajduje się w menu pauzy.

---

## 📁 Struktura Plików

```
giera/
├── index.html          # Główny plik HTML
├── style.css           # Style CSS
├── plan.md             # Plan rozwoju
├── GAME_DOCUMENTATION.md # Ta dokumentacja
└── js/
    ├── game.js         # Główny kontroler gry
    ├── player.js       # Klasa gracza, statystyki
    ├── weapon.js       # Definicje broni, pociski
    ├── enemy.js        # Typy wrogów, bossy
    ├── shop.js         # System sklepu
    ├── wave.js         # Zarządzanie falami
    ├── audio.js        # System dźwięku
    └── utils.js        # Funkcje pomocnicze
```

---

## 🎨 Technologie

- **JavaScript** - Vanilla JS, bez frameworków
- **HTML5 Canvas** - Renderowanie grafiki
- **Web Audio API** - Proceduralne generowanie dźwięków
- **CSS3** - Stylizacja UI

---

## 🔧 Kluczowe Decyzje Projektowe

1. **Auto-aim** - Automatyczne celowanie w najbliższego wroga dla płynniejszej rozgrywki
2. **Bronie orbitujące** - Wizualne ikony broni krążące wokół gracza
3. **Dynamiczne ceny** - Skalowanie cen zapobiega nadmiarowi złota w późnej grze
4. **Różnorodność bossów** - 6 typów bossów z unikalnymi mechanikami
5. **System statystyk** - Rozbudowany system pozwalający na różne buildy
6. **Legendarne przedmioty** - Nagroda za zbieranie złota, potężne kombinacje efektów
7. **Generator nazw bossów** - Dodaje klimatu do walki z bossami
8. **Proceduralne audio** - Brak potrzeby zewnętrznych plików dźwiękowych

---

## 🐛 Naprawione Błędy

1. ✅ Sklep nie pokazywał broni → gwarantowane 2 bronie w ofercie
2. ✅ Pancerz pokazywał 1500% → poprawiony wzór wyświetlania
3. ✅ Bronie nie celowały w wrogów → każda broń liczy kąt niezależnie
4. ✅ Crash przy efekcie łańcucha kuszy → usunięto mechanikę łańcucha, kusza teraz tylko przebija
5. ✅ Zbyt dużo złota w późnej grze → dynamiczne skalowanie cen

---

## 🚀 Potencjalne Przyszłe Rozszerzenia

- [ ] System poziomów gracza
- [ ] Więcej typów broni
- [ ] Pasywne umiejętności
- [ ] Tryb endless
- [ ] Tablica wyników
- [ ] Różne postacie do wyboru
- [ ] Eventy specjalne podczas fal
- [ ] Achievement system

---

*Ostatnia aktualizacja: 10 grudnia 2025*
