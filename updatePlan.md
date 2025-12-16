# Circle-Survivor: Migracja do TypeScript

Kompleksowa refaktoryzacja z vanilla JS do TypeScript z wzorcami kompozycji, dependency injection i event-driven architecture.

## Docelowa struktura projektu

```
src/
├── core/           # GameLoop, GameState, Game, EventBus
├── config/         # Typed configs (as const)
├── types/          # Interfaces, Enums
├── entities/       # Player, Enemy, Weapon, projectiles/, pickups/
│   └── base/       # Entity, PhysicsEntity, CombatEntity
├── systems/        # Collision, Combat, Spawn, Wave, Audio
├── rendering/      # Renderer, EntityRenderer, Effects
├── ui/             # ShopUI, LeaderboardUI, MenuUI
├── managers/       # EntityManager
├── utils/          # math, collision, random
└── main.ts         # Entry point
```

---

## Faza 1: Fundament TypeScript

### 1.1 Setup toolchain
- [ ] Vite + TypeScript strict mode
- [ ] Vitest dla unit testów
- [ ] ESLint + Prettier
- [ ] Struktura `src/`
- [ ] Przenieś `index.html` do root (Vite standard)
- [ ] Zaktualizuj `.github/workflows/` (patrz sekcja Workflows)

### 1.2 Interfejsy komponentów (`src/types/components.ts`)
- [ ] `ITransform` - pozycja (x, y)
- [ ] `IVelocity` - prędkość (vx, vy)
- [ ] `ICircleCollider` - kolizje (radius)
- [ ] `IRenderable` - render(ctx)
- [ ] `IUpdatable` - update(deltaTime)
- [ ] `IHealth` - hp, maxHp, takeDamage(), heal()
- [ ] `IDamageDealer` - damage
- [ ] `IExpirable` - lifetime, isExpired()
- [ ] `IKnockbackable` - knockbackX/Y, applyKnockback()

### 1.3 Interfejsy encji (`src/types/entities.ts`)
- [ ] `IEntity` - bazowy interfejs
- [ ] `IPlayer` - gracz
- [ ] `IEnemy` - wróg
- [ ] `IProjectile` - pocisk (uniwersalny)
- [ ] `IPickup` - pickup
- [ ] `IWeapon` - broń

### 1.4 Enumy (`src/types/enums.ts`)
- [ ] `ProjectileType` - STANDARD, ROCKET, SCYTHE, SWORD, BANANA, HOLY_GRENADE, CROSSBOW_BOLT, MINI_BANANA, ENEMY_BULLET
- [ ] `DeployableType` - MINE, TURRET, TRAP (przyszłość)
- [ ] `VisualEffect` - STANDARD, NUKE, HOLY, FIRE, CHAIN
- [ ] `GameState` - MENU, PLAYING, SHOP, PAUSED, GAME_OVER
- [ ] `EnemyType` - BASIC, FAST, TANK, SWARM, BOSS, etc.
- [ ] `PickupType` - GOLD, HEALTH

### 1.5 Typed configs (`src/config/`)
- [ ] `balance.config.ts` - GAME_BALANCE as const
- [ ] `weapons.config.ts` - WEAPON_TYPES z typami
- [ ] `enemies.config.ts` - ENEMY_TYPES z typami
- [ ] `items.config.ts` - SHOP_ITEMS z typami
- [ ] `characters.config.ts` - CHARACTER_TYPES
- [ ] `version.config.ts` - wersja z import.meta.env

### 1.6 Utils (`src/utils/`)
- [ ] `math.ts` - distance, normalize, clamp, randomRange, randomInt
- [ ] `collision.ts` - circleCollision, rectCircleCollision
- [ ] `random.ts` - getSpawnPoint

---

## Faza 2: Encje z kompozycją

### 2.1 Bazowe klasy (`src/entities/base/`)
- [ ] `Entity.ts` - abstrakcyjna baza (id, x, y, render, update)
- [ ] `PhysicsEntity.ts` - extends Entity + IVelocity, ICircleCollider
- [ ] `CombatEntity.ts` - extends PhysicsEntity + IHealth

### 2.2 Pociski (`src/entities/projectiles/`)

**Architektura: Enum + Komponenty (Composition)**

```typescript
// Projectile.ts - latające pociski z velocity
class Projectile implements IProjectile {
    readonly type: ProjectileType;
    x: number;
    y: number;
    vx: number;      // Latające pociski mają velocity
    vy: number;
    radius: number;
    damage: number;
    
    // Opcjonalne komponenty zachowań
    explosive?: ExplosiveComponent;
    pierce?: PierceComponent;
    chain?: ChainComponent;
}
```

- [ ] `Projectile.ts` - latające pociski (bullet, rocket, scythe, banana...)
- [ ] `ProjectileType.ts` - enum (STANDARD, ROCKET, SCYTHE, SWORD, BANANA, HOLY_GRENADE, CROSSBOW_BOLT, MINI_BANANA, ENEMY_BULLET)
- [ ] `components/ExplosiveComponent.ts` - eksplozje (radius, visualEffect: VisualEffect)
- [ ] `components/PierceComponent.ts` - przebijanie (maxPierces, hitEnemies)
- [ ] `components/ChainComponent.ts` - chain lightning (maxChains, damageMultiplier)
- [ ] `ProjectileRenderer.ts` - renderowanie per ProjectileType

### 2.3 Deployables (`src/entities/deployables/`)

**Statyczne obiekty - nie latają, mają timer/trigger**

```typescript
// Deployable.ts - statyczne obiekty (miny, wieżyczki)
abstract class Deployable implements IDeployable {
    readonly type: DeployableType;
    x: number;
    y: number;
    radius: number;
    lifetime: number;      // Czas życia
    spawnTime: number;
    isArmed: boolean;      // Czy aktywny
    
    abstract onTrigger(game: Game): void;  // Co się dzieje przy aktywacji
}

// Mine.ts
class Mine extends Deployable {
    armDelay: number = 500;  // ms do uzbrojenia
    explosive: ExplosiveComponent;
    
    onTrigger() { /* eksplozja */ }
}

// Turret.ts (przyszłość)
class Turret extends Deployable {
    fireRate: number;
    range: number;
    
    update() { /* szuka celów, strzela */ }
}
```

- [ ] `Deployable.ts` - bazowa klasa statycznych obiektów
- [ ] `DeployableType.ts` - enum (MINE, TURRET, TRAP...)
- [ ] `Mine.ts` - mina (timer, explosive)
- [ ] `DeployableRenderer.ts` - renderowanie per typ

### 2.4 Pickupy (`src/entities/pickups/`)
- [ ] `Pickup.ts` - z IExpirable

### 2.4 Główne encje
- [ ] `Enemy.ts` - extends CombatEntity, wydzielony rendering
- [ ] `Weapon.ts` - tworzy Projectile z odpowiednim typem i komponentami
- [ ] `Player.ts` - extends CombatEntity, zarządza weapons[]

---

## Faza 3: Systemy z Dependency Injection

### 3.1 Core (`src/core/`)
- [ ] `EventBus.ts` - prosty pub/sub
  - Eventy: `enemyDeath`, `playerHit`, `waveEnd`, `waveStart`, `goldCollected`, `itemPurchased`

### 3.2 Managers (`src/managers/`)
- [ ] `EntityManager.ts` - zarządzanie encjami (add, remove, getAll, getById)
  - Object pooling zaplanowany na później

### 3.3 Systemy (`src/systems/`)
- [ ] `CollisionSystem.ts` - wykrywanie kolizji, emituje eventy
- [ ] `CombatSystem.ts` - eksplozje, chain efekty, obrażenia
- [ ] `SpawnSystem.ts` - (ex EnemySpawner) tworzenie encji
- [ ] `WaveSystem.ts` - (ex WaveManager) zarządzanie falami
- [ ] `AudioSystem.ts` - dźwięki z DI zamiast globalnego `audio`

---

## Faza 4: Refaktor Game + UI

### 4.1 Rozbicie Game (637 → ~150 linii)
- [ ] `GameLoop.ts` - requestAnimationFrame, deltaTime
- [ ] `GameState.ts` - state machine (menu, playing, shop, paused, gameover)
- [ ] `Game.ts` - koordynator łączący systemy

### 4.2 Rendering (`src/rendering/`)
- [ ] `Renderer.ts` - orchestrator renderingu
- [ ] `EntityRenderer.ts` - renderowanie encji
- [ ] `EffectsRenderer.ts` - particles, eksplozje, shockwave
- [ ] `HUDRenderer.ts` - canvas HUD (boss HP bar)

### 4.3 UI (`src/ui/`)
- [ ] `ShopUI.ts` - modal sklepu
- [ ] `LeaderboardUI.ts` - tablica wyników
- [ ] `MenuUI.ts` - menu główne, pauza

### 4.4 Finalizacja
- [ ] Zaktualizuj `index.html` - jeden `<script type="module">`
- [ ] Usuń stare pliki `js/`
- [ ] Testy jednostkowe dla systemów

---

## Decyzje architektoniczne

| Aspekt | Decyzja |
|--------|---------|
| **Bundler** | Vite (szybki DX, natywny TS) |
| **Testy** | Vitest |
| **Object Pooling** | Później (po migracji) |
| **Event System** | Prosty EventBus (nie pełny ECS) |
| **State Machine** | Enum + switch (nie biblioteka) |
| **Pociski** | Jedna klasa `Projectile` z `ProjectileType` enum + komponenty |
| **Statyczne obiekty** | Osobna klasa `Deployable` dla min, wieżyczek (bez velocity) |
| **Efekty wizualne** | Enum `VisualEffect` zamiast boolean flags |

---

## Dokumentacja

### Aktualizacja README.md
- [ ] Instrukcja uruchomienia lokalnie:
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
- [ ] Sekcja "Development" z opisem struktury projektu
- [ ] Sekcja "Contributing" z informacją o TypeScript, ESLint

---

## Aktualizacja GitHub Workflows

Po migracji do Vite/TypeScript, workflows wymagają zmian:

### Obecny stan (vanilla JS)
- Uploaduje cały katalog (`.`)
- Wstrzykuje `js/version.js` bezpośrednio
- Wstrzykuje secrets do `js/leaderboard.js`

### Po migracji (Vite + TypeScript)

**deploy.yml - zmiany:**
```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      
      # NOWE: Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      # NOWE: Install dependencies
      - name: Install dependencies
        run: npm ci
      
      # ZMIANA: Wersja przez env variable
      - name: Get version
        id: version
        run: |
          TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
          echo "VERSION=${TAG#v}" >> $GITHUB_OUTPUT
      
      # NOWE: Build z env variables
      - name: Build
        env:
          VITE_GAME_VERSION: ${{ steps.version.outputs.VERSION }}
          VITE_JSONBIN_BIN_ID: ${{ secrets.JSONBIN_BIN_ID }}
          VITE_JSONBIN_API_KEY: ${{ secrets.JSONBIN_API_KEY }}
        run: npm run build
      
      # ZMIANA: Upload dist/ zamiast .
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'
```

**Zmiany w kodzie:**
```typescript
// src/config/version.config.ts
export const GAME_VERSION = import.meta.env.VITE_GAME_VERSION || 'dev';

// src/services/LeaderboardService.ts
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const JSONBIN_API_KEY = import.meta.env.VITE_JSONBIN_API_KEY;
```

### Pliki do aktualizacji w Fazie 1:
- [ ] `.github/workflows/deploy.yml` - dodaj npm ci, npm build, dist/
- [ ] `.github/workflows/release.yml` - to samo w job `deploy`
- [ ] Usuń `scripts/inject-secrets.js` (niepotrzebny)
- [ ] Dodaj `.env.example` z template dla env variables

---

## Postęp

- [ ] **Faza 1** - Fundament TypeScript
- [ ] **Faza 2** - Encje z kompozycją
- [ ] **Faza 3** - Systemy z DI
- [ ] **Faza 4** - Refaktor Game + UI
