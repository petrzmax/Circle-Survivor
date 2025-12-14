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

Just open `index.html` in your browser - no build step required!

## 🏷️ Versioning

The game uses Git tags for versioning. The version is automatically injected during GitHub Pages deployment.

### Bumping version:
```bash
# Check current version
git describe --tags

# Create a new tag (e.g. v1.0.0 -> v1.1.0)
git tag v1.1.0

# Push the tag
git push --tags
```

After pushing to `master`/`main`, GitHub Actions will automatically fetch the latest tag and display it in the game menu.
