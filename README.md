# Circle Survivor 🎮

Circle Survivor is a Brotato-like survival game, vibe coded with Copilot.

## 🎯 Play Now

**[▶️ Play Circle Survivor](https://petrzmax.github.io/Circle-Survivor/)**

## 🎮 How to Play

- Use **WASD** or **Arrow Keys** to move
- Avoid enemies and survive waves
- Collect gold and buy upgrades in the shop
- Survive as long as possible!

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in optional values:

- `VITE_GAME_VERSION` - Game version (set automatically during CI/CD)
- `VITE_JSONBIN_BIN_ID` - JSONBin.io bin ID for global leaderboard (optional)
- `VITE_JSONBIN_API_KEY` - JSONBin.io API key (optional)

## 📝 Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

### Commit Format

```bash
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (1.0.0 → 1.1.0) |
| `fix` | Bug fix | Patch (1.0.0 → 1.0.1) |
| `docs` | Documentation only | - |
| `style` | Code style (formatting, semicolons) | - |
| `refactor` | Code refactoring (no feature/fix) | - |
| `perf` | Performance improvement | - |
| `test` | Adding/updating tests | - |
| `chore` | Maintenance tasks | - |
| `ci` | CI/CD changes | - |
| `build` | Build system changes | - |

### Breaking Changes

Add `!` after type or `BREAKING CHANGE:` in footer for major version bump:

```bash
feat!: remove support for legacy save format
# or
feat: new save system

BREAKING CHANGE: old saves are no longer compatible
```
