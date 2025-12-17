# Circle-Survivor: Migracja do TypeScript

Kompleksowa refaktoryzacja z vanilla JS do TypeScript z wzorcami kompozycji, dependency injection i event-driven architecture.

## Struktura projektu

```
src/
├── core/           # EventBus
├── config/         # Typed configs (balance, weapons, enemies, shop, characters)
├── types/          # Interfaces, Enums (components, entities)
├── entities/       # Player, Enemy, Weapon, Projectile, Deployable, Pickup
├── systems/        # Collision, Combat, Spawn, Wave, Audio
├── rendering/      # ProjectileRenderer, EnemyRenderer, PlayerRenderer, etc.
├── managers/       # EntityManager
├── utils/          # math, collision, random
└── main.ts         # Entry point (TODO)
```

---

## Status migracji

| Faza | Status | Opis |
|------|--------|------|
| **Faza 1** | ✅ 100% | Fundament TypeScript |
| **Faza 2** | ✅ 100% | Encje z kompozycją |
| **Faza 3** | ✅ 100% | Systemy z DI |
| **Faza 4** | ⏳ 0% | Game + UI |

---

## Faza 1: Fundament TypeScript ✅

### 1.1 Setup toolchain ✅
- [x] Vite + TypeScript strict mode (`tsconfig.json`, `vite.config.ts`)
- [x] Vitest dla unit testów (`vitest.config.ts`)
- [x] ESLint (`eslint.config.js`)
- [x] Struktura `src/`
- [x] GitHub workflows zaktualizowane dla Vite
- [x] `.env.example` dodany

### 1.2 Interfejsy komponentów (`src/types/components.ts`) ✅
- [x] `ITransform`, `IVelocity`, `ICircleCollider`
- [x] `IRenderable`, `IUpdatable`
- [x] `IHealth`, `IDamageDealer`, `IKnockbackable`
- [x] `IExpirable`, `ICollectible`
- [x] `IExplosive`, `IPierce`, `IChain`

### 1.3 Interfejsy encji (`src/types/entities.ts`) ✅
- [x] `IEntity`, `IPhysicsEntity`, `ICombatEntity`
- [x] `IProjectile`, `IDeployable`, `IPickup`
- [x] `IEnemy`, `IWeapon`, `IPlayer`, `IPlayerStats`

### 1.4 Enumy (`src/types/enums.ts`) ✅
- [x] `ProjectileType` - STANDARD, ROCKET, SCYTHE, SWORD, BANANA, HOLY_GRENADE, CROSSBOW_BOLT, MINI_BANANA, ENEMY_BULLET, NUKE, FLAMETHROWER
- [x] `DeployableType` - MINE, TURRET, TRAP
- [x] `VisualEffect` - STANDARD, NUKE, HOLY, FIRE, CHAIN, BANANA
- [x] `GameState` - MENU, PLAYING, SHOP, PAUSED, GAME_OVER
- [x] `EnemyType` - BASIC, FAST, TANK, SWARM, SPRINTER, BRUTE, GHOST, EXPLODER, ZIGZAG, SPLITTER + wszystkie BOSS_*
- [x] `PickupType` - GOLD, HEALTH
- [x] `WeaponType` - PISTOL, SMG, SHOTGUN, SNIPER, LASER, MINIGUN, BAZOOKA, FLAMETHROWER, MINES, NUKE, SCYTHE, SWORD, HOLY_GRENADE, BANANA, CROSSBOW
- [x] `WeaponCategory` - GUN, ROCKET, SPECIAL, MELEE, GRENADE, DEPLOYABLE
- [x] `CharacterType` - WYPALENIEC, CWANIAK, NORMIK

### 1.5 Typed configs (`src/config/`) ✅
| Plik | Status |
|------|--------|
| `balance.config.ts` | ✅ 100% zgodny z JS |
| `weapons.config.ts` | ✅ 100% zgodny z JS |
| `enemies.config.ts` | ✅ 100% zgodny z JS |
| `shop.config.ts` | ✅ 100% zgodny z JS |
| `characters.config.ts` | ✅ 100% zgodny z JS |

### 1.6 Utils (`src/utils/`) ✅
- [x] `math.ts` - distance, distanceSquared, normalize, magnitude, clamp, lerp, vectors, angles
- [x] `collision.ts` - circleCollision, entityCollision, rectCircleCollision
- [x] `random.ts` - randomRange, randomInt, randomChance, randomElement, getSpawnPoint

---

## Faza 2: Encje z kompozycją ✅

### 2.1 Bazowa klasa (`src/entities/Entity.ts`) ✅
- [x] Abstrakcyjna baza z id, x, y, radius, velocity, isActive
- [x] Metody: `getVelocity()`, `setVelocity()`, `applyVelocity()`, `moveTowards()`

### 2.2 Pociski (`src/entities/Projectile.ts`) ✅
- [x] Jedna klasa `Projectile` z `ProjectileType` enum
- [x] Komponenty: `ExplosiveComponent`, `PierceComponent`, `ChainComponent`
- [x] Właściwości: isCrit, knockbackMultiplier, weaponCategory, explosiveRange

### 2.3 Deployables (`src/entities/Deployable.ts`) ✅
- [x] Klasa `Deployable` z `DeployableType` enum
- [x] Obsługa min z armingTime, triggerRadius, isArmed
- [x] Eksplozje z visualEffect

### 2.4 Główne encje ✅
- [x] `Enemy.ts` - pełna implementacja z konfiguracją z ENEMY_TYPES, attack patterns, boss names
- [x] `Player.ts` - pełna implementacja ze statami, weapons, items
- [x] `Pickup.ts` - z typami GOLD, HEALTH, animacją bobbing
- [x] `Weapon.ts` - fire(), upgrade(), clone(), wszystkie typy broni

### 2.5 Renderery (`src/rendering/`) ✅
- [x] `ProjectileRenderer.ts` - renderowanie per ProjectileType
- [x] `DeployableRenderer.ts` - renderowanie min, turrets, traps
- [x] `EnemyRenderer.ts` - z HP bar, boss glow, boss name
- [x] `PlayerRenderer.ts` - z invincibility flash, health bar
- [x] `PickupRenderer.ts` - gold coins, health hearts z animacją

---

## Faza 3: Systemy z DI ✅

### 3.1 Core (`src/core/`) ✅
- [x] `EventBus.ts` - typowany pub/sub z eventami:
  - Combat: `enemyDeath`, `enemyDamaged`, `playerHit`, `playerDeath`
  - Projectile: `projectileHit`, `projectileExpired`, `explosionTriggered`
  - Pickup: `goldCollected`, `healthCollected`, `pickupSpawned`, `pickupExpired`
  - Wave: `waveStart`, `waveEnd`, `bossSpawned`, `bossDefeated`
  - Shop: `shopOpened`, `shopClosed`, `itemPurchased`, `weaponPurchased`
  - Game: `gameStart`, `gamePause`, `gameResume`, `gameOver`

### 3.2 Managers (`src/managers/`) ✅
- [x] `EntityManager.ts` - zarządzanie encjami (player, enemies, projectiles, deployables, pickups)

### 3.3 Systemy (`src/systems/`) ✅
- [x] `CollisionSystem.ts` - wykrywanie kolizji player-enemy, projectile-enemy, pickup
- [x] `CombatSystem.ts` - eksplozje, chain efekty, obrażenia
- [x] `SpawnSystem.ts` - spawning wrogów per typ
- [x] `WaveSystem.ts` - zarządzanie falami, boss waves
- [x] `AudioSystem.ts` - interfejs audio

---

## Faza 4: Game + UI ⏳

### 4.1 Game Loop (TODO)
- [ ] `GameLoop.ts` - requestAnimationFrame, deltaTime, fixed timestep
- [ ] `GameState.ts` - state machine (MENU, PLAYING, SHOP, PAUSED, GAME_OVER)
- [ ] `Game.ts` - główny koordynator łączący wszystkie systemy

### 4.2 Rendering orchestration (TODO)
- [ ] `Renderer.ts` - główny orchestrator renderingu
- [ ] `EffectsRenderer.ts` - particles, eksplozje, shockwave
- [ ] `HUDRenderer.ts` - canvas HUD (boss HP bar, score, wave info)

### 4.3 UI (TODO)
- [ ] `ShopUI.ts` - modal sklepu
- [ ] `LeaderboardUI.ts` - tablica wyników
- [ ] `MenuUI.ts` - menu główne, pauza

### 4.4 Finalizacja (TODO)
- [ ] `main.ts` - entry point
- [ ] Zaktualizuj `index.html` - jeden `<script type="module">`
- [ ] Usuń stare pliki `js/`
- [ ] Testy jednostkowe

---

## Decyzje architektoniczne

| Aspekt | Decyzja |
|--------|---------|
| **Bundler** | Vite (szybki DX, natywny TS) |
| **Testy** | Vitest |
| **Object Pooling** | Później (po migracji) |
| **Event System** | Prosty EventBus (nie pełny ECS) |
| **State Machine** | Enum + switch |
| **Pociski** | Jedna klasa `Projectile` z enum + komponenty |
| **Statyczne obiekty** | Osobna klasa `Deployable` (bez velocity) |
| **Efekty wizualne** | Enum `VisualEffect` |
| **Rendering** | Wydzielone renderery per typ encji |

---

## Uruchomienie lokalne

```bash
# Wymagania: Node.js 18+

# Instalacja zależności
npm install

# Uruchomienie dev server (hot reload)
npm run dev

# Build produkcyjny
npm run build

# Preview buildu
npm run preview

# Testy
npm run test
```

---

## Następne kroki

1. **Faza 4.1** - Stworzyć `GameLoop.ts` i `GameState.ts`
2. **Faza 4.1** - Stworzyć `Game.ts` łączący wszystkie systemy
3. **Faza 4.2** - Stworzyć `Renderer.ts` i `EffectsRenderer.ts`
4. **Faza 4.3** - Stworzyć komponenty UI (Shop, Leaderboard, Menu)
5. **Faza 4.4** - Stworzyć `main.ts` i połączyć wszystko
6. **Faza 4.4** - Usunąć stare pliki `js/`
