# Project Guidelines

## Tech Stack

TypeScript, HTML5 Canvas, Vite, Koota (ECS), tsyringe (DI), Preact (UI), Vitest

## Build & Test

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server with hot reload
npm run build        # tsc + vite build → dist/
npm run test         # Vitest (no tests exist yet — jsdom environment)
npm run lint         # ESLint
npm run lint:fix     # ESLint autofix
npm run format       # Prettier
```

Conventional Commits required — see README.md for commit format and types.

## Architecture

**Game loop** (`src/core/Game.ts`): `requestAnimationFrame` → update all systems → `RenderSystem.render()`. No fixed timestep.

**ECS** (Koota): Single global `world` in `src/ecs/world.ts`. Entities are composed of **traits** (not classes). Traits defined in `src/ecs/traits/`. Entity factories in `src/ecs/factories/entity-factories.ts`.

**Dependency injection** (tsyringe): All systems/services are `@singleton()` + `@injectable()`. Entry point resolves `Game` from the DI container in `src/main.ts`.

**Events** (`src/events/EventBus.ts`): Type-safe pub/sub. Event types in `src/events/GameEvents.ts`. Systems communicate via events, not direct references.

**State machine** (`src/managers/StateManager.ts`): FSM with validated transitions (MENU → PLAYING ↔ PAUSED, WAVE_CLEARED → SHOP → PLAYING, GAME_OVER → MENU). Emits `stateEntered` event.

**Rendering**: Canvas for game entities (dedicated renderers in `src/rendering/`), Preact DOM for UI overlays (`src/ui/`). They don't conflict.

### System Update Order

PlayerSystem → EnemySystem → ProjectileSystem → PhysicsSystem → CollisionSystem → CollisionResponseSystem → DamageSystem → DeathSystem → PickupSpawnSystem → PickupAttractionSystem → PickupCollisionSystem → PickupSystem → EffectsSystem → ExplosionSystem → WaveManager → RewardSystem → RenderSystem

### Key Components

| What | Where |
|------|-------|
| Entity queries | `src/managers/EntityManager.ts` — cached queries, never create queries in hot loops |
| Config injection | `src/config/ConfigService.ts` — singleton, getters for all config objects |
| Config values | `src/config/balance.config.ts` (balancing), `characters.config.ts`, `effects.config.ts`, `layout.config.ts`, `shop.config.ts` |
| Object pools | `src/utils/object-pool.ts` — generic `ObjectPool<T extends Poolable>`, used for particles/explosions |
| Domain logic | `src/domain/` — enemies (factory, spawner, scaling), player, weapons, audio |
| Collision | `src/systems/CollisionSystem.ts` — returns structured `CollisionResult` with 8 collision types |
| Physics | `src/systems/PhysicsSystem.ts` — impulse-based: accumulate impulses → integrate velocity → update position |

## Code Style

- **Composition over Inheritance.** Use classes for systems/services, traits for entity data.
- Interfaces define contracts between systems. Separate in `type.ts` files.
- Comments in English. Comment only non-obvious logic. Prefer small methods with self-descriptive names.
- No abbreviations for field names.

## Naming Conventions

- `camelCase`: functions, variables, methods
- `kebab-case`: file names (e.g., `game-loop.ts`)
- `PascalCase`: classes, interfaces, traits
- `UPPERCASE`: constants
- Booleans: prefix with `is`, `has`, `should` (e.g., `isVisible`, `hasCollided`)

## Project-Specific Conventions

- **Reuse existing utils**: `src/utils/collision.ts`, `math.ts`, `random.ts`, `combat-math.ts`, `object-pool.ts`
- **Inject configs** through `ConfigService` — never import config objects directly in systems
- **ECS traits**: Read with `entity.get(Trait)!`, update with `entity.set(Trait, { ... })`
- **Dead entities**: Marked with `IsDead` tag, cleaned up by `DeathSystem` — never delete entities directly
- **Time**: All systems read frame time from `world.get(Time)`, updated each frame in `Game.ts`
- **EventBus is global**: Import directly, no need to inject — `EventBus.on()/emit()`
- **Object pools**: Always `release()` objects back to the pool when done

## Performance

- Minimize object creation in `update()` and `draw()` methods (GC pressure)
- Minimize Canvas context state changes (`fillStyle`, `save/restore`)
- Use cached entity queries from `EntityManager` — don't create queries in loops
- Use `ObjectPool` for frequently created/destroyed objects (particles, effects)

## Gotchas

- `applyImpulse()` on the player only works if the player entity has a `PhysicsBody` trait.
- HUD stats panel (`src/systems/HUD.ts`) updates DOM elements directly; boss health bar and enemy count are Canvas-rendered. Preact handles menus/shop/overlays (`src/ui/`).
- Fullscreen API is hidden on iOS Safari — check existence before showing UI.

## Documentation

- Game design (weapons, enemies, bosses, mechanics): `GAME_DOCUMENTATION.md` (in Polish)
- Release history: `CHANGELOG.md`
