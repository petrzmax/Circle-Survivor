# Ideas

## UI & UX

- Remove player stats from the in-game HUD; show them only in the shop.
- In the shop, display detailed stat descriptions with hover tooltips.
- Show damage numbers on hit.
- Add an in-game pause/debug menu allowing managing weapons (sell)
- Display weapon stats and stat changes clearly when upgrading (tooltip on hover).

## Shop & Progression

- Life steal is too strong → change it to a chance-based effect.

## Enemies & Combat

- Separate bosses into a distinct enemy object/class.
- Prevent enemies from overlapping the player; they should collide and stop at the player’s edges.
- If enemies of the same type stack tightly into one spot, merge them into a stronger enemy.
- If two bosses are present, display their HP bars stacked vertically.
- still too high boss touch dmg
- improve lock to not push enemies outside the map. it works on the center of enemy, let it work so there is no way to push out his side
- Boss sinus projectiles po sinusoidzie
- Boss homing missle
- Boss throwing grenades
- Boss big slow projectile
- brute is too hard.
- third boss also it has too high dmg
- boss niech paczy oczami na gracza
- boss ghost, miga i widac pociski w jego srodku

## Waves & Design

- Add waves with a different approach:
  - Few but very strong enemies (e.g. one shooting a huge laser across the entire map).
  - Forces a strategic shift compared to swarms of weak enemies.
- Special waves - drop some types of enemies in the same time in larger amount, from different sides.

## Power-ups

- Baits (Lures)
  - Placeable like mines.
  - Attract enemies until they die.
- Slowdown
  - Slows enemies around the player.
- Knockback
  - Pushes enemies away.
- Double player in size (3x more hp, 2x slower)
- Investor - not used gold has +% at the start of the wave
- Portfel / sakwa dusigrosza
- Okulary / Narzędzia Radka

## Leaderboards & Records

- Show record date in rankings.
- Display the character used in leaderboards.
- Include both character and date for each leaderboard entry.
- With records, save player data - items and weapons used.

## Performance & Technical

- Make movement speed and audio independent of frame rate.
- Wave end ticker is not heared if there is a lot of sounds
- background, render cache
- Volume control
- Spawn system
- Wave system
- MovementSystem, PhysicsSystem

## Refactor prompts

- why collision.ts is not used?
- Now if there is many sounds ticker is not heared at the end of the wave
- save and continuation every wave
- Add item rarity, some items which may appear only once in the shop.
- Mini bananas does not have colisions with enemies
- check rendereres, and try to optimize minus location, and whole rendering
- rebalance all items - recalculate.

Krzysztof feedback:

1. wiecej statystyk widocznych na ekranie
2. mechanika w ktorej bedac w spoczynku pieniadze sa podnoszone szybciej i/lub z wiekszego dystansu
3. wieksze skalowanie przeciwnikow po fali np 20?
4. balast - zmniejszenie szybkosci
5. Ulepszanie broni? ulepsza jaka jedna bron a reszte zostawia bez zmian (gdy mam pare broni tego samego typu)
6. przedmioty mja mase. im wiecej dźwiga postać tym wolniej chodzi, jesli ma powyzej pewnego udźwigu
7. Predkosc przyciagania picka zalezna od czasu od wejscia w zasieg zbierania. liniowe przyspieszanie
