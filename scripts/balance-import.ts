/**
 * Balance Import Script
 *
 * Reads balance-data/balance.xlsx and patches modified values back
 * into the original TypeScript config files using regex replacement.
 *
 * This approach preserves all comments, formatting, and field ordering —
 * only the actual numeric/enum values are updated in-place.
 *
 * Usage: npm run balance:import
 *
 * Behavior:
 * - Only processes the 6 known sheet names
 * - Patches values in-place (no code generation, no field lists)
 * - Comments and formatting are fully preserved
 * - Runs Prettier on modified files
 */

import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

import { WEAPON_TYPES } from '../src/domain/weapons/config';
import { WeaponType, WeaponCategory } from '../src/domain/weapons/type';
import { ENEMY_TYPES } from '../src/domain/enemies/config';
import { SHOP_ITEMS } from '../src/config/shop.config';
import { GAME_BALANCE } from '../src/config/balance.config';
import { CHARACTER_TYPES } from '../src/config/characters.config';
import { WAVE_COMPOSITION } from '../src/config/waves.config';
import {
  EnemyType,
  CharacterType,
  ProjectileType,
  DeployableType,
  VisualEffect,
} from '../src/types/enums';

// ============ Constants ============

const INPUT_FILE = path.resolve(import.meta.dirname, '..', 'balance-data', 'balance.xlsx');
const SRC_DIR = path.resolve(import.meta.dirname, '..', 'src');
const ROOT_DIR = path.resolve(import.meta.dirname, '..');

const FILES = {
  weaponsConfig: path.join(SRC_DIR, 'domain', 'weapons', 'config.ts'),
  shopConfig: path.join(SRC_DIR, 'config', 'shop.config.ts'),
  enemiesConfig: path.join(SRC_DIR, 'domain', 'enemies', 'config.ts'),
  balanceConfig: path.join(SRC_DIR, 'config', 'balance.config.ts'),
  charactersConfig: path.join(SRC_DIR, 'config', 'characters.config.ts'),
  wavesConfig: path.join(SRC_DIR, 'config', 'waves.config.ts'),
};

// ============ Auto-generated enum maps ============
// Derived from the actual TypeScript enums — no manual lists to maintain.

/** Build a map from enum string value → 'EnumName.MEMBER' TS expression */
function buildEnumTSMap(enumObj: Record<string, string>, enumName: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [member, value] of Object.entries(enumObj)) {
    result[value] = `${enumName}.${member}`;
  }
  return result;
}

/** Build a map from enum string value → regex pattern for matching `[EnumName.MEMBER]` blocks */
function buildBlockKeyMap(
  enumObj: Record<string, string>,
  enumName: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [member, value] of Object.entries(enumObj)) {
    result[value] = `\\[${enumName}\\.${member}\\]`;
  }
  return result;
}

/** Maps field name → { enumStringValue → 'EnumName.MEMBER' } for all enum-typed config fields */
export const ENUM_MAPS: Record<string, Record<string, string>> = {
  weaponCategory: buildEnumTSMap(WeaponCategory, 'WeaponCategory'),
  projectileType: buildEnumTSMap(ProjectileType, 'ProjectileType'),
  deployableType: buildEnumTSMap(DeployableType, 'DeployableType'),
  explosionEffect: buildEnumTSMap(VisualEffect, 'VisualEffect'),
  startingWeapon: buildEnumTSMap(WeaponType, 'WeaponType'),
};

// Enum keys (field names) that reference enums in weapon configs
export const WEAPON_ENUM_FIELDS = new Set([
  'weaponCategory',
  'projectileType',
  'deployableType',
  'explosionEffect',
]);
// Enum keys in character configs
export const CHARACTER_ENUM_FIELDS = new Set(['startingWeapon']);

// ============ Sheet Reading ============

type SheetRow = Record<string, unknown>;

/** Convert a typed config object to a plain Record without unsafe casts */
function toRecord(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj));
}

function readSheet(workbook: ExcelJS.Workbook, sheetName: string): SheetRow[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value);
  });

  const rows: SheetRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj: SheetRow = {};
    let hasData = false;
    for (let c = 1; c <= headers.length; c++) {
      const header = headers[c];
      if (!header) continue;
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined) {
        obj[header] = cell.value;
        hasData = true;
      }
    }
    if (hasData) rows.push(obj);
  }
  return rows;
}

// ============ Patching Helpers ============

/** Format a value for TypeScript source */
export function toTSValue(value: unknown, field: string, enumFields: Set<string>): string {
  if (value === null || value === undefined) return '';

  // Enum field — look up TS expression
  if (enumFields.has(field)) {
    const map = ENUM_MAPS[field];
    const strVal = String(value);
    if (map?.[strVal]) return map[strVal];
    // Fallback: wrap as string literal
    return `'${strVal}'`;
  }

  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);

  const strVal = String(value);
  if (strVal === 'true') return 'true';
  if (strVal === 'false') return 'false';
  const num = Number(strVal);
  if (!isNaN(num) && strVal.trim() !== '') return String(num);
  return `'${strVal.replace(/'/g, "\\'")}'`;
}

/**
 * Find a config block in source by key pattern and replace a field value.
 * Returns the modified source, or the original if no match found.
 *
 * @param source Full file content
 * @param blockKeyPattern Regex that matches the block's key (e.g., `\[WeaponType\.PISTOL\]`)
 * @param fieldName The field name to update
 * @param newValue The new TS value string
 */
export function patchFieldInBlock(
  source: string,
  blockKeyPattern: string,
  fieldName: string,
  newValue: string,
): { source: string; patched: boolean } {
  // Match: blockKey: { ... fieldName: VALUE ...
  // The field can have a trailing comment which we want to preserve
  const pattern = new RegExp(
    `(${blockKeyPattern}:\\s*\\{[^}]*?)(${fieldName}:\\s*)([^,\\n]+)(,)`,
    's',
  );

  const match = source.match(pattern);
  if (!match) return { source, patched: false };

  // Preserve trailing comment if any
  const oldValueWithComment = match[3] ?? '';
  const commentMatch = oldValueWithComment.match(/^[^/]*?(\/\/.*)$/);
  const trailing = commentMatch ? ` ${commentMatch[1]}` : '';

  const replacement = `${match[1]}${match[2]}${newValue}${trailing}${match[4]}`;
  return {
    source: source.replace(pattern, replacement),
    patched: true,
  };
}

/**
 * For deeply nested configs like GAME_BALANCE,
 * patch a dot-path value (e.g. "physics.separationForce").
 */
export function patchBalanceValue(
  source: string,
  dotPath: string,
  newValue: string,
): { source: string; patched: boolean } {
  const parts = dotPath.split('.');
  const fieldName = parts[parts.length - 1]!;

  // Build a regex that matches the field within the nested structure
  // Match: fieldName: VALUE, (with optional trailing comment)
  const pattern = new RegExp(`(${fieldName}:\\s*)([^,\\n]+)(,)`, 'g');

  // We need to find the RIGHT occurrence. Use the path to narrow down.
  // Strategy: find all matches, pick the one within the right section.
  let patched = false;
  let result = source;

  // For balance config, locate the section by finding parent keys in order
  let searchStart = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    const sectionKey = parts[i]!;
    const sectionPattern = new RegExp(`${sectionKey}:\\s*\\{`, 'g');
    sectionPattern.lastIndex = searchStart;
    const sectionMatch = sectionPattern.exec(result);
    if (!sectionMatch) return { source, patched: false };
    searchStart = sectionMatch.index + sectionMatch[0].length;
  }

  // Now find the field after searchStart
  pattern.lastIndex = searchStart;
  const match = pattern.exec(result);
  if (match) {
    const oldValueWithComment = match[2]!;
    const commentMatch = oldValueWithComment.match(/^[^/]*?(\/\/.*)$/);
    const trailing = commentMatch ? ` ${commentMatch[1]}` : '';

    const replacement = `${match[1]}${newValue}${trailing}${match[3]}`;
    result =
      result.slice(0, match.index) + replacement + result.slice(match.index + match[0].length);
    patched = true;
  }

  return { source: result, patched };
}

// ============ Auto-generated block key maps ============

const WEAPON_BLOCK_KEYS = buildBlockKeyMap(WeaponType, 'WeaponType');
const ENEMY_BLOCK_KEYS = buildBlockKeyMap(EnemyType, 'EnemyType');
const CHARACTER_BLOCK_KEYS = buildBlockKeyMap(CharacterType, 'CharacterType');

/** Inverse of the block key — find shop key for a weapon type */
function findShopKeyForWeapon(weaponType: string): string | undefined {
  for (const [key, item] of Object.entries(SHOP_ITEMS)) {
    if (item.type === 'weapon' && item.weaponType === weaponType) return key;
  }
  return undefined;
}

// ============ Generic import ============

interface ImportStats {
  checked: number;
  changed: number;
  warnings: string[];
}

interface SheetConfig {
  label: string;
  keyField: string;
  filePath: string;
  blockKeys?: Record<string, string>;
  enumFields?: Set<string>;
  getValues: () => Record<string, Record<string, unknown>>;
  formatValue?: (field: string, value: unknown) => string | undefined;
}

/**
 * Generic importer for config sheets that follow the standard pattern:
 * read one file → loop rows → compare values → patchFieldInBlock → write.
 */
function importSheet(
  rows: SheetRow[],
  config: SheetConfig,
): { files: string[]; stats: ImportStats } {
  const current = config.getValues();
  const stats: ImportStats = { checked: 0, changed: 0, warnings: [] };
  let source = fs.readFileSync(config.filePath, 'utf-8');
  let modified = false;
  const enumFields = config.enumFields ?? new Set<string>();

  for (const row of rows) {
    const key = String(row[config.keyField]);
    const currentVals = current[key];
    if (!currentVals) {
      stats.warnings.push(`${config.label}: unknown ${config.keyField} '${key}'`);
      continue;
    }

    const blockKey = config.blockKeys?.[key] ?? key;

    for (const [field, newVal] of Object.entries(row)) {
      if (field === config.keyField || newVal == null) continue;
      stats.checked++;
      if (String(newVal) === String(currentVals[field] ?? '')) continue;

      const tsVal = config.formatValue?.(field, newVal) ?? toTSValue(newVal, field, enumFields);
      const result = patchFieldInBlock(source, blockKey, field, tsVal);
      if (result.patched) {
        source = result.source;
        stats.changed++;
        modified = true;
      } else {
        stats.warnings.push(`${config.label}[${key}].${field}: could not patch`);
      }
    }
  }

  if (modified) fs.writeFileSync(config.filePath, source, 'utf-8');
  return { files: modified ? [config.filePath] : [], stats };
}

// ============ Sheet configs (for generic importer) ============

function formatAttackPatterns(field: string, value: unknown): string | undefined {
  if (field !== 'attackPatterns') return undefined;
  const patterns = String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return `[${patterns.map((p) => `'${p}'`).join(', ')}]`;
}

const ENEMY_SHEET: SheetConfig = {
  label: 'Enemies',
  keyField: 'type',
  filePath: FILES.enemiesConfig,
  blockKeys: ENEMY_BLOCK_KEYS,
  getValues: () => {
    const result: Record<string, Record<string, unknown>> = {};
    for (const [key, config] of Object.entries(ENEMY_TYPES)) {
      const record = toRecord(config);
      if (Array.isArray(record.attackPatterns)) {
        record.attackPatterns = (record.attackPatterns as string[]).join(',');
      }
      result[key] = record;
    }
    return result;
  },
  formatValue: formatAttackPatterns,
};

const CHARACTER_SHEET: SheetConfig = {
  label: 'Characters',
  keyField: 'id',
  filePath: FILES.charactersConfig,
  blockKeys: CHARACTER_BLOCK_KEYS,
  enumFields: CHARACTER_ENUM_FIELDS,
  getValues: () => {
    const result: Record<string, Record<string, unknown>> = {};
    for (const [key, config] of Object.entries(CHARACTER_TYPES)) {
      result[key] = toRecord(config);
    }
    return result;
  },
};

const ITEM_SHEET: SheetConfig = {
  label: 'Items',
  keyField: 'id',
  filePath: FILES.shopConfig,
  getValues: () => {
    const result: Record<string, Record<string, unknown>> = {};
    for (const [key, item] of Object.entries(SHOP_ITEMS)) {
      if (item.type !== 'item') continue;
      result[key] = { price: item.price, minWave: item.minWave, ...toRecord(item.effect) };
    }
    return result;
  },
};

// ============ Custom importers (unique logic per sheet) ============

/** Weapons patch two files: weapon stats → weapons/config.ts, price/minWave → shop.config.ts */
function importWeapons(rows: SheetRow[]): { files: string[]; stats: ImportStats } {
  const shopLookup: Record<string, { price: number; minWave?: number }> = {};
  for (const item of Object.values(SHOP_ITEMS)) {
    if (item.type === 'weapon') {
      shopLookup[item.weaponType] = { price: item.price, minWave: item.minWave };
    }
  }
  const current: Record<string, Record<string, unknown>> = {};
  for (const [key, config] of Object.entries(WEAPON_TYPES)) {
    const shop = shopLookup[key];
    current[key] = { ...toRecord(config), price: shop?.price, minWave: shop?.minWave };
  }

  const stats: ImportStats = { checked: 0, changed: 0, warnings: [] };
  const modifiedFiles = new Set<string>();
  let weaponSource = fs.readFileSync(FILES.weaponsConfig, 'utf-8');
  let shopSource = fs.readFileSync(FILES.shopConfig, 'utf-8');

  for (const row of rows) {
    const type = String(row.type);
    const currentVals = current[type];
    if (!currentVals) {
      stats.warnings.push(`Weapons: unknown type '${type}'`);
      continue;
    }

    const blockKey = WEAPON_BLOCK_KEYS[type]!;
    const shopKey = findShopKeyForWeapon(type);

    for (const [field, newVal] of Object.entries(row)) {
      if (field === 'type' || newVal == null) continue;
      stats.checked++;
      if (String(newVal) === String(currentVals[field] ?? '')) continue;

      const tsVal = toTSValue(newVal, field, WEAPON_ENUM_FIELDS);

      if ((field === 'price' || field === 'minWave') && shopKey) {
        const result = patchFieldInBlock(shopSource, shopKey, field, tsVal);
        if (result.patched) {
          shopSource = result.source;
          stats.changed++;
          modifiedFiles.add(FILES.shopConfig);
        } else {
          stats.warnings.push(`Weapons[${type}].${field}: could not patch in shop config`);
        }
      } else if (field !== 'price' && field !== 'minWave') {
        const result = patchFieldInBlock(weaponSource, blockKey, field, tsVal);
        if (result.patched) {
          weaponSource = result.source;
          stats.changed++;
          modifiedFiles.add(FILES.weaponsConfig);
        } else {
          stats.warnings.push(`Weapons[${type}].${field}: could not patch`);
        }
      }
    }
  }

  if (modifiedFiles.has(FILES.weaponsConfig))
    fs.writeFileSync(FILES.weaponsConfig, weaponSource, 'utf-8');
  if (modifiedFiles.has(FILES.shopConfig)) fs.writeFileSync(FILES.shopConfig, shopSource, 'utf-8');
  return { files: [...modifiedFiles], stats };
}

/** Balance uses dot-path patching (patchBalanceValue) instead of block patching */
function importBalance(rows: SheetRow[]): { files: string[]; stats: ImportStats } {
  const flat: Record<string, unknown> = {};
  (function walk(obj: Record<string, unknown>, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        walk(val as Record<string, unknown>, p);
      } else {
        flat[p] = val;
      }
    }
  })(toRecord(GAME_BALANCE));

  const stats: ImportStats = { checked: 0, changed: 0, warnings: [] };
  let source = fs.readFileSync(FILES.balanceConfig, 'utf-8');
  let modified = false;

  for (const row of rows) {
    const dotPath = String(row.path);
    const newVal = row.value;
    if (!dotPath || newVal == null) continue;
    stats.checked++;
    if (String(newVal) === String(flat[dotPath] ?? '')) continue;

    const tsVal = toTSValue(newVal, '', new Set());
    const result = patchBalanceValue(source, dotPath, tsVal);
    if (result.patched) {
      source = result.source;
      stats.changed++;
      modified = true;
    } else {
      stats.warnings.push(`Balance[${dotPath}]: could not patch`);
    }
  }

  if (modified) fs.writeFileSync(FILES.balanceConfig, source, 'utf-8');
  return { files: modified ? [FILES.balanceConfig] : [], stats };
}

/** Waves have a unique structure: wave number → [{ type, weight }] entries */
function importWaves(rows: SheetRow[]): { files: string[]; stats: ImportStats } {
  const current: Record<number, Record<string, number>> = {};
  for (const [wave, entries] of Object.entries(WAVE_COMPOSITION)) {
    const weights: Record<string, number> = {};
    for (const e of entries) weights[e.type] = e.weight;
    current[Number(wave)] = weights;
  }

  const stats: ImportStats = { checked: 0, changed: 0, warnings: [] };
  let source = fs.readFileSync(FILES.wavesConfig, 'utf-8');
  let modified = false;

  for (const row of rows) {
    const wave = Number(row.wave);
    const currentWeights = current[wave];
    if (!currentWeights) {
      stats.warnings.push(`Waves: unknown wave ${wave}`);
      continue;
    }

    for (const [enemyType, newWeight] of Object.entries(row)) {
      if (enemyType === 'wave' || newWeight == null) continue;
      stats.checked++;
      if (String(newWeight) === String(currentWeights[enemyType] ?? '')) continue;

      const waveBlockPattern = new RegExp(`${wave}:\\s*\\[([\\s\\S]*?)\\]`);
      const waveMatch = source.match(waveBlockPattern);
      if (!waveMatch) {
        stats.warnings.push(`Waves[${wave}].${enemyType}: could not find wave block`);
        continue;
      }

      const blockKey = ENEMY_BLOCK_KEYS[enemyType]!;
      const entryPattern = new RegExp(
        `(\\{\\s*type:\\s*${blockKey.replace(/\\\[/g, '').replace(/\\\]/g, '')},\\s*weight:\\s*)(\\S+)(\\s*\\})`,
      );
      const entryMatch = waveMatch[1]!.match(entryPattern);
      if (!entryMatch) {
        stats.warnings.push(`Waves[${wave}].${enemyType}: could not find entry`);
        continue;
      }

      source = source.replace(entryMatch[0], `${entryMatch[1]}${newWeight}${entryMatch[3]}`);
      stats.changed++;
      modified = true;
    }
  }

  if (modified) fs.writeFileSync(FILES.wavesConfig, source, 'utf-8');
  return { files: modified ? [FILES.wavesConfig] : [], stats };
}

// ============ Main ============

async function main() {
  console.log('📥 Balance Import — reading XLSX...');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ File not found: ${INPUT_FILE}`);
    console.error('   Run "npm run balance:export" first to generate the workbook.');
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(INPUT_FILE);
  console.log('  📂 Loaded workbook');

  const allModifiedFiles = new Set<string>();
  const allWarnings: string[] = [];
  let totalChanged = 0;

  const importers: {
    name: string;
    sheetName: string;
    fn: (rows: SheetRow[]) => { files: string[]; stats: ImportStats };
  }[] = [
    { name: 'Weapons', sheetName: 'Weapons', fn: importWeapons },
    { name: 'Items', sheetName: 'Items', fn: (rows) => importSheet(rows, ITEM_SHEET) },
    { name: 'Enemies', sheetName: 'Enemies', fn: (rows) => importSheet(rows, ENEMY_SHEET) },
    { name: 'Balance', sheetName: 'Balance', fn: importBalance },
    {
      name: 'Characters',
      sheetName: 'Characters',
      fn: (rows) => importSheet(rows, CHARACTER_SHEET),
    },
    { name: 'Waves', sheetName: 'Waves', fn: importWaves },
  ];

  for (const { name, sheetName, fn } of importers) {
    const rows = readSheet(workbook, sheetName);
    if (rows.length === 0) {
      console.log(`  ⏭️  ${name}: no data`);
      continue;
    }
    const { files, stats } = fn(rows);
    files.forEach((f) => allModifiedFiles.add(f));
    allWarnings.push(...stats.warnings);
    totalChanged += stats.changed;
    console.log(`  ✅ ${name}: ${stats.changed} changes (${stats.checked} checked)`);
  }

  // Format modified files with Prettier
  if (allModifiedFiles.size > 0) {
    console.log('\n  🎨 Running Prettier...');
    try {
      const fileArgs = [...allModifiedFiles].map((f) => `"${f}"`).join(' ');
      execSync(`npx prettier --write ${fileArgs}`, {
        cwd: ROOT_DIR,
        stdio: 'pipe',
      });
      console.log('  ✅ Formatted');
    } catch {
      console.warn('  ⚠️  Prettier failed — files saved without formatting');
    }
  }

  // Report
  if (allWarnings.length > 0) {
    console.error('\n⚠️  Warnings:');
    for (const w of allWarnings) {
      console.error(`  - ${w}`);
    }
  }

  if (totalChanged === 0) {
    console.log('\n📁 No changes detected — source files unchanged.');
  } else {
    console.log(`\n📁 Patched ${totalChanged} values across ${allModifiedFiles.size} file(s).`);
    console.log('   Run "git diff" to review changes.');
  }
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
