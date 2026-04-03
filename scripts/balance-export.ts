/**
 * Balance Export Script
 *
 * Reads game config TypeScript files and exports balance data
 * to a single XLSX workbook with 6 data sheets.
 *
 * Columns are auto-detected from the config objects — no hardcoded
 * field lists to maintain. Only a small exclusion set controls what's skipped.
 *
 * Usage: npm run balance:export
 *
 * Re-export behavior (preserve mode):
 * - If balance.xlsx already exists, reads it first
 * - Extra sheets (user's analysis tabs) are 100% preserved
 * - Extra columns in data sheets are preserved
 * - Cell styles/formatting are preserved (only .value is updated)
 * - New config params get appended as new columns
 */

import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';

import { WEAPON_TYPES } from '../src/domain/weapons/config';
import { ENEMY_TYPES } from '../src/domain/enemies/config';
import { SHOP_ITEMS } from '../src/config/shop.config';
import { GAME_BALANCE } from '../src/config/balance.config';
import { CHARACTER_TYPES } from '../src/config/characters.config';
import { WAVE_COMPOSITION } from '../src/config/waves.config';

// ============ Constants ============

const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'balance-data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'balance.xlsx');

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
  border: {
    bottom: { style: 'thin', color: { argb: 'FF999999' } },
  },
};

/** Fields excluded from export (non-balance, display-only) */
const EXCLUDED_FIELDS: Record<string, Set<string>> = {
  weapons: new Set(['name', 'emoji', 'color', 'deployableType', 'rotationSpeed', 'friction']),
  enemies: new Set(['color']),
  characters: new Set(['name', 'description', 'emoji', 'color']),
  items: new Set(['name', 'description', 'emoji', 'type']),
};

// ============ Helpers ============

type Row = Record<string, unknown>;

/** Convert a typed config object to a plain Record without unsafe casts */
function toRecord(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj));
}

/** Collect the union of all keys across multiple config entries */
function collectAllKeys(configs: Record<string, object>, exclude: Set<string>): string[] {
  const keys = new Set<string>();
  for (const config of Object.values(configs)) {
    for (const key of Object.keys(config)) {
      if (!exclude.has(key)) keys.add(key);
    }
  }
  return [...keys];
}

/** Build a lookup from weapon type → shop item data */
function buildWeaponShopLookup(): Record<string, { price: number; minWave?: number }> {
  const lookup: Record<string, { price: number; minWave?: number }> = {};
  for (const item of Object.values(SHOP_ITEMS)) {
    if (item.type === 'weapon') {
      lookup[item.weaponType] = { price: item.price, minWave: item.minWave };
    }
  }
  return lookup;
}

/** Flatten a nested object to dot-notation key-value pairs */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): { path: string; value: unknown }[] {
  const result: { path: string; value: unknown }[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result.push(...flattenObject(val as Record<string, unknown>, fullPath));
    } else {
      result.push({ path: fullPath, value: val });
    }
  }
  return result;
}

/** Get or create a worksheet in the workbook */
function getOrCreateSheet(workbook: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  return workbook.getWorksheet(name) ?? workbook.addWorksheet(name);
}

/** Write data to a sheet, preserving existing cell styles */
function writeSheet(sheet: ExcelJS.Worksheet, columns: string[], rows: Row[], isNewSheet: boolean) {
  // Build column index map from existing headers
  const existingColMap = new Map<string, number>();
  if (!isNewSheet && sheet.rowCount > 0) {
    sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (typeof cell.value === 'string') {
        existingColMap.set(cell.value, colNumber);
      }
    });
  }

  // Determine column positions
  const colPositions = new Map<string, number>();
  let nextCol = existingColMap.size > 0 ? Math.max(...existingColMap.values()) + 1 : 1;
  for (const col of columns) {
    colPositions.set(col, existingColMap.get(col) ?? nextCol++);
  }

  // Write headers
  const headerRow = sheet.getRow(1);
  for (const [col, pos] of colPositions) {
    const cell = headerRow.getCell(pos);
    cell.value = col;
    if (isNewSheet) cell.style = HEADER_STYLE as ExcelJS.Style;
  }

  // Write data rows
  for (let i = 0; i < rows.length; i++) {
    const dataRow = sheet.getRow(i + 2);
    const rowData = rows[i]!;
    for (const [col, pos] of colPositions) {
      const cell = dataRow.getCell(pos);
      const value = rowData[col];
      cell.value = value == null ? null : (value as ExcelJS.CellValue);
    }
  }

  // Clear leftover rows
  for (let r = rows.length + 2; r <= sheet.rowCount; r++) {
    for (const [, pos] of colPositions) {
      sheet.getRow(r).getCell(pos).value = null;
    }
  }

  // Format new sheets
  if (isNewSheet) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows.length > 0) {
      const maxCol = Math.max(...colPositions.values());
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: rows.length + 1, column: maxCol },
      };
    }
    for (const [col, pos] of colPositions) {
      const maxLen = Math.max(col.length, ...rows.map((r) => String(r[col] ?? '').length));
      sheet.getColumn(pos).width = Math.min(Math.max(maxLen + 2, 8), 30);
    }
  }
}

// ============ Sheet Builders ============

function buildWeaponRows(): { columns: string[]; rows: Row[] } {
  const shopLookup = buildWeaponShopLookup();
  const exclude = EXCLUDED_FIELDS.weapons!;

  // Auto-detect balance columns from all weapon configs
  const balanceKeys = collectAllKeys(WEAPON_TYPES, exclude);

  const columns = ['type', 'price', 'minWave', ...balanceKeys];
  const rows: Row[] = [];

  for (const [key, config] of Object.entries(WEAPON_TYPES)) {
    const shopData = shopLookup[key];
    const row: Row = { type: key, price: shopData?.price, minWave: shopData?.minWave };

    for (const col of balanceKeys) {
      const val = toRecord(config)[col];
      if (val !== undefined) row[col] = val;
    }
    rows.push(row);
  }

  return { columns, rows };
}

function buildItemRows(): { columns: string[]; rows: Row[] } {
  const rows: Row[] = [];

  // Auto-detect effect fields from all stat items
  const effectKeys = new Set<string>();
  for (const item of Object.values(SHOP_ITEMS)) {
    if (item.type === 'item') {
      for (const key of Object.keys(item.effect)) {
        effectKeys.add(key);
      }
    }
  }

  const columns = ['id', 'price', 'minWave', ...effectKeys];

  for (const [key, item] of Object.entries(SHOP_ITEMS)) {
    if (item.type !== 'item') continue;
    const row: Row = { id: key, price: item.price, minWave: item.minWave };
    for (const col of effectKeys) {
      const val = toRecord(item.effect)[col];
      if (val !== undefined) row[col] = val;
    }
    rows.push(row);
  }

  return { columns, rows };
}

function buildEnemyRows(): { columns: string[]; rows: Row[] } {
  const exclude = EXCLUDED_FIELDS.enemies!;
  const balanceKeys = collectAllKeys(ENEMY_TYPES, exclude);

  const columns = ['type', ...balanceKeys];
  const rows: Row[] = [];

  for (const [key, config] of Object.entries(ENEMY_TYPES)) {
    const row: Row = { type: key };
    for (const col of balanceKeys) {
      const val = toRecord(config)[col];
      if (val !== undefined) {
        row[col] = Array.isArray(val) ? val.join(',') : val;
      }
    }
    rows.push(row);
  }

  return { columns, rows };
}

function buildBalanceRows(): { columns: string[]; rows: Row[] } {
  const flat = flattenObject(toRecord(GAME_BALANCE));
  return {
    columns: ['path', 'value'],
    rows: flat.map(({ path, value }) => ({ path, value })),
  };
}

function buildCharacterRows(): { columns: string[]; rows: Row[] } {
  const exclude = EXCLUDED_FIELDS.characters!;
  const balanceKeys = collectAllKeys(CHARACTER_TYPES, exclude);

  const columns = ['id', ...balanceKeys];
  const rows: Row[] = [];

  for (const [key, config] of Object.entries(CHARACTER_TYPES)) {
    const row: Row = { id: key };
    for (const col of balanceKeys) {
      const val = toRecord(config)[col];
      if (val !== undefined) row[col] = val;
    }
    rows.push(row);
  }

  return { columns, rows };
}

function buildWaveRows(): { columns: string[]; rows: Row[] } {
  const allEnemyTypes = new Set<string>();
  for (const entries of Object.values(WAVE_COMPOSITION)) {
    for (const e of entries) allEnemyTypes.add(e.type);
  }

  const enemyTypeCols = [...allEnemyTypes].sort();
  const columns = ['wave', ...enemyTypeCols];
  const rows: Row[] = [];

  const waveNumbers = Object.keys(WAVE_COMPOSITION)
    .map(Number)
    .sort((a, b) => a - b);

  for (const waveNum of waveNumbers) {
    const row: Row = { wave: waveNum };
    for (const e of WAVE_COMPOSITION[waveNum]!) {
      row[e.type] = e.weight;
    }
    rows.push(row);
  }

  return { columns, rows };
}

// ============ Main ============

async function main() {
  console.log('📊 Balance Export — reading game configs...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const fileExists = fs.existsSync(OUTPUT_FILE);

  if (fileExists) {
    await workbook.xlsx.readFile(OUTPUT_FILE);
    console.log('  📂 Loaded existing workbook (preserve mode)');
  } else {
    console.log('  📄 Creating new workbook');
  }

  const isNew = (name: string) => !fileExists || !workbook.getWorksheet(name);

  const sheets: { name: string; data: { columns: string[]; rows: Row[] } }[] = [
    { name: 'Weapons', data: buildWeaponRows() },
    { name: 'Items', data: buildItemRows() },
    { name: 'Enemies', data: buildEnemyRows() },
    { name: 'Balance', data: buildBalanceRows() },
    { name: 'Characters', data: buildCharacterRows() },
    { name: 'Waves', data: buildWaveRows() },
  ];

  for (const { name, data } of sheets) {
    const sheetIsNew = isNew(name);
    const sheet = getOrCreateSheet(workbook, name);
    writeSheet(sheet, data.columns, data.rows, sheetIsNew);
    console.log(`  ✅ ${name}: ${data.rows.length} entries`);
  }

  await workbook.xlsx.writeFile(OUTPUT_FILE);
  console.log(`\n📁 Exported to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
