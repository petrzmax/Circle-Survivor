# Plan: Git-Flow z branczem develop i automatyczną release'ą

## Cel
Wdrożenie workflow'u rozwojowego z automatycznym release'm: ręczne odpalenie workflow → auto-bump wersji → changelog z git log → auto-merge do master → deploy.

## Architektura Branchy

```
master (produkcja)     ← GitHub Pages deployment
  ↑
  │ auto-merge przez release workflow
  │
develop (rozwój)       ← domyślny branch, bezpośrednie commity
```

## Kroki Implementacji

### 1. Utworzenie branch `develop`
- Utworzyć branch `develop` z `master`
- Ustawić `develop` jako domyślny branch w ustawieniach repo (Settings → Branches → Default branch)
- Przyszłe commity będą trafiać bezpośrednio do `develop`

### 2. Branch Protection na `master`
**RĘCZNE KROKI (GitHub UI):**
- Settings → Branches → Add branch protection rule
- Branch name pattern: `master`
- ✅ Require a pull request before merging
  - Require approvals: 0 (workflow będzie miał uprawnienia do auto-merge)
- ✅ Do not allow bypassing the above settings
- ✅ Allow force pushes → Specify who can push
  - Dodać: GitHub Actions (aby workflow mógł mergować)

### 3. Utworzenie `.github/workflows/release.yml`
**Workflow z ręcznym triggerem:**

**Trigger:**
- `workflow_dispatch` z inputem:
  - `bump_type`: choice (patch/minor/major)
  - default: `patch`

**Permissions:**
- `contents: write` - do tworzenia tagów i mergowania
- `pull-requests: write` - (opcjonalne, na przyszłość)

**Kroki:**

#### 3.1. Checkout z pełną historią
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # potrzebne dla git describe i git log
    ref: develop     # checkout develop branch
```

#### 3.2. Konfiguracja Git
```yaml
- name: Configure Git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
```

#### 3.3. Auto-bump wersji (bash script)
```bash
# Pobranie ostatniego tagu
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
CURRENT_VERSION=${CURRENT_TAG#v}

# Parsing semantic version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]:-0}
MINOR=${VERSION_PARTS[1]:-0}
PATCH=${VERSION_PARTS[2]:-0}

# Inkrementacja wg wyboru użytkownika
BUMP_TYPE=${{ inputs.bump_type }}

case $BUMP_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="v${MAJOR}.${MINOR}.${PATCH}"
echo "NEW_VERSION=$NEW_VERSION" >> $GITHUB_OUTPUT
echo "New version: $NEW_VERSION"
```

#### 3.4. Generowanie changelogu (git log parser)
```bash
# Prosty parser: wszystkie commity od ostatniego tagu
git log $CURRENT_TAG..HEAD --pretty=format:"- %s (%h)" > CHANGELOG_ENTRY.md

# Jeśli brak commitów, dodaj placeholder
if [ ! -s CHANGELOG_ENTRY.md ]; then
  echo "- No changes" > CHANGELOG_ENTRY.md
fi

# Zapisz do output dla GitHub Release
CHANGELOG=$(cat CHANGELOG_ENTRY.md)
echo "CHANGELOG<<EOF" >> $GITHUB_OUTPUT
echo "$CHANGELOG" >> $GITHUB_OUTPUT
echo "EOF" >> $GITHUB_OUTPUT
```

#### 3.5. Utworzenie tagu
```bash
git tag -a $NEW_VERSION -m "Release $NEW_VERSION"
git push origin $NEW_VERSION
```

#### 3.6. Utworzenie GitHub Release
```yaml
- name: Create GitHub Release
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag_name: ${{ steps.version.outputs.NEW_VERSION }}
    release_name: Release ${{ steps.version.outputs.NEW_VERSION }}
    body: ${{ steps.version.outputs.CHANGELOG }}
    draft: false
    prerelease: false
```

#### 3.7. Auto-merge `develop` → `master`
```bash
# Checkout master
git fetch origin master
git checkout master
git pull origin master

# Merge develop
git merge develop --no-ff -m "Release $NEW_VERSION: merge develop to master"

# Push do master (triggeruje deploy workflow)
git push origin master
```

### 4. Aktualizacja `.github/workflows/deploy.yml`
**Zmiany w triggerach:**

**Stare:**
```yaml
on:
  push:
    branches: [ master, main ]
  workflow_dispatch:
```

**Nowe:**
```yaml
on:
  push:
    branches: [ master ]
```

**Uzasadnienie:**
- Usunięcie `main` (używamy tylko `master`)
- Usunięcie `workflow_dispatch` (release odbywa się tylko przez release workflow)
- Deploy triggeruje się automatycznie po merge'u do `master` przez release workflow

**Pozostała część bez zmian** - workflow dalej:
- Pobiera wersję z tagu
- Wstrzykuje wersję do `js/version.js`
- Wstrzykuje sekrety do `js/leaderboard.js`
- Deployuje na GitHub Pages

## Workflow Użytkownika

### Normalny development:
1. Commituj bezpośrednio do `develop`
   ```bash
   git add .
   git commit -m "Add new weapon type"
   git push origin develop
   ```

2. Testy lokalne, iteracja, więcej commitów...

### Release (gdy gotowy do wydania wersji):
1. Idź do GitHub → Actions → Release workflow
2. Kliknij "Run workflow"
3. Wybierz `bump_type`:
   - **patch** (1.0.0 → 1.0.1) - drobne poprawki, bugfixy
   - **minor** (1.0.0 → 1.1.0) - nowe funkcje, większe zmiany
   - **major** (1.0.0 → 2.0.0) - breaking changes, duże przepisanie
4. Kliknij "Run workflow"

### Co się dzieje automatycznie:
1. ✅ Nowa wersja jest obliczana (np. v1.2.3)
2. ✅ Changelog generowany z commitów od ostatniego tagu
3. ✅ Tag tworzony na `develop`
4. ✅ GitHub Release publikowany z changelogiem
5. ✅ `develop` mergowany do `master`
6. ✅ Deploy workflow triggeruje się automatycznie
7. ✅ Gra deployowana na GitHub Pages z nową wersją

## Uwagi Techniczne

### Permissions w release workflow
Workflow będzie miał uprawnienia do auto-merge mimo branch protection dzięki:
- GitHub Actions ma specjalne uprawnienia jako bot
- `contents: write` pozwala na push do protected branches w kontekście workflow

### Pierwsza wersja
Jeśli nie masz jeszcze żadnego tagu:
- Workflow wykryje brak tagów (fallback do `v0.0.0`)
- Przy pierwszym release z `patch` utworzy `v0.0.1`
- Możesz też ręcznie wybrać `minor` → `v0.1.0` lub `major` → `v1.0.0`

### Rollback w razie błędu
Jeśli coś pójdzie nie tak:
```bash
# Usuń tag lokalnie i zdalnie
git tag -d vX.Y.Z
git push --delete origin vX.Y.Z

# Usuń release na GitHubie (UI lub gh cli)
gh release delete vX.Y.Z

# Cofnij merge do mastera (jeśli trzeba)
git checkout master
git reset --hard HEAD~1
git push --force origin master
```

### Upgrade do Conventional Commits (przyszłość)
W przyszłości, jeśli zaczniesz używać prefixów w commit messages:
- `feat: add laser weapon` → 🚀 Features
- `fix: collision detection` → 🐛 Bug Fixes
- `chore: refactor code` → 🧰 Maintenance

Możesz upgrade'ować parser changelogu do auto-kategoryzacji:
```bash
# Features
git log $TAG..HEAD --pretty=format:"- %s (%h)" --grep="^feat:"

# Bug Fixes  
git log $TAG..HEAD --pretty=format:"- %s (%h)" --grep="^fix:"

# Maintenance
git log $TAG..HEAD --pretty=format:"- %s (%h)" --grep="^chore:"
```

## Pliki do Utworzenia/Modyfikacji

### Nowe:
- `.github/workflows/release.yml` - workflow release'owy

### Zmodyfikowane:
- `.github/workflows/deploy.yml` - zmiana triggerów

### Ręczne (GitHub UI):
- Branch protection rule dla `master`
- Ustawienie `develop` jako default branch

## Kolejność Implementacji

1. Utworzyć branch `develop` lokalnie i wypchnąć
2. Ustawić branch protection + default branch (GitHub UI)
3. Utworzyć `.github/workflows/release.yml`
4. Zmodyfikować `.github/workflows/deploy.yml`
5. Przetestować release workflow z wersją `patch`
6. Sprawdzić czy deploy na master działa
7. Sprawdzić czy wersja wyświetla się poprawnie w grze

## Checklist

- [ ] Branch `develop` utworzony i wypchnięty
- [ ] `develop` ustawiony jako default branch (GitHub Settings)
- [ ] Branch protection na `master` skonfigurowany (GitHub Settings)
- [ ] Plik `.github/workflows/release.yml` utworzony
- [ ] Plik `.github/workflows/deploy.yml` zaktualizowany
- [ ] Pierwszy testowy release wykonany (np. v0.1.0)
- [ ] GitHub Release widoczny z changelogiem
- [ ] Deploy na master zadziałał automatycznie
- [ ] Wersja wyświetla się poprawnie w grze (menu)
