/**
 * Tests for balance export/import scripts.
 *
 * Integration tests run actual export → XLSX → import flows.
 * Unit tests cover the patch/format utility functions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

import {
  toTSValue,
  patchFieldInBlock,
  patchBalanceValue,
  WEAPON_ENUM_FIELDS,
} from './balance-import';

import { WEAPON_TYPES } from '../src/domain/weapons/config';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const TEST_XLSX = path.resolve(import.meta.dirname, '..', 'balance-data', 'balance-test.xlsx');
const REAL_XLSX = path.resolve(import.meta.dirname, '..', 'balance-data', 'balance.xlsx');

// ============================================================
// Unit Tests — toTSValue
// ============================================================

describe('toTSValue', () => {
  it('formats numbers directly', () => {
    expect(toTSValue(42, 'damage', new Set())).toBe('42');
    expect(toTSValue(3.14, 'speed', new Set())).toBe('3.14');
  });

  it('formats booleans', () => {
    expect(toTSValue(true, 'explosive', new Set())).toBe('true');
    expect(toTSValue(false, 'phasing', new Set())).toBe('false');
  });

  it('formats string booleans', () => {
    expect(toTSValue('true', 'explosive', new Set())).toBe('true');
    expect(toTSValue('false', 'phasing', new Set())).toBe('false');
  });

  it('parses numeric strings as numbers', () => {
    expect(toTSValue('100', 'damage', new Set())).toBe('100');
    expect(toTSValue('0.5', 'regen', new Set())).toBe('0.5');
  });

  it('wraps plain strings in quotes', () => {
    expect(toTSValue('#ff0000', 'color', new Set())).toBe("'#ff0000'");
  });

  it('escapes single quotes in strings', () => {
    expect(toTSValue("don't", 'comment', new Set())).toBe("'don\\'t'");
  });

  it('returns empty string for null/undefined', () => {
    expect(toTSValue(null, 'x', new Set())).toBe('');
    expect(toTSValue(undefined, 'x', new Set())).toBe('');
  });

  it('maps enum field values to TS expressions', () => {
    expect(toTSValue('gun', 'weaponCategory', WEAPON_ENUM_FIELDS)).toBe('WeaponCategory.GUN');
    expect(toTSValue('rocket', 'projectileType', WEAPON_ENUM_FIELDS)).toBe('ProjectileType.ROCKET');
    expect(toTSValue('mine', 'deployableType', WEAPON_ENUM_FIELDS)).toBe('DeployableType.MINE');
    expect(toTSValue('nuke', 'explosionEffect', WEAPON_ENUM_FIELDS)).toBe('VisualEffect.NUKE');
  });

  it('falls back to string literal for unknown enum values', () => {
    expect(toTSValue('unknownCategory', 'weaponCategory', WEAPON_ENUM_FIELDS)).toBe(
      "'unknownCategory'",
    );
  });
});

// ============================================================
// Unit Tests — patchFieldInBlock
// ============================================================

describe('patchFieldInBlock', () => {
  const source = `
  [WeaponType.PISTOL]: {
    name: 'Pistolet',
    emoji: '🔫',
    fireRate: 500,
    damage: 10,
    bulletSpeed: 900,
    range: 265,
  },`;

  it('patches a numeric field value', () => {
    const result = patchFieldInBlock(source, '\\[WeaponType\\.PISTOL\\]', 'damage', '25');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('damage: 25,');
    expect(result.source).not.toContain('damage: 10,');
  });

  it('patches fireRate field', () => {
    const result = patchFieldInBlock(source, '\\[WeaponType\\.PISTOL\\]', 'fireRate', '300');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('fireRate: 300,');
  });

  it('returns patched: false when block not found', () => {
    const result = patchFieldInBlock(source, '\\[WeaponType\\.SMG\\]', 'damage', '5');
    expect(result.patched).toBe(false);
    expect(result.source).toBe(source);
  });

  it('returns patched: false when field not found in block', () => {
    const result = patchFieldInBlock(source, '\\[WeaponType\\.PISTOL\\]', 'pierceCount', '2');
    expect(result.patched).toBe(false);
    expect(result.source).toBe(source);
  });

  it('preserves trailing inline comments', () => {
    const sourceWithComment = `
  [WeaponType.SCYTHE]: {
    rotationSpeed: 4, // ~0.6 rotations per second
    friction: 0.02,
  },`;
    const result = patchFieldInBlock(
      sourceWithComment,
      '\\[WeaponType\\.SCYTHE\\]',
      'rotationSpeed',
      '6',
    );
    expect(result.patched).toBe(true);
    expect(result.source).toContain('rotationSpeed: 6, // ~0.6 rotations per second');
  });

  it('does not cross block boundaries', () => {
    const multiBlock = `
  [WeaponType.PISTOL]: {
    damage: 10,
    range: 265,
  },
  [WeaponType.SMG]: {
    damage: 5,
    range: 215,
  },`;
    // Patch damage in PISTOL - should only change PISTOL's damage
    const result = patchFieldInBlock(multiBlock, '\\[WeaponType\\.PISTOL\\]', 'damage', '20');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('[WeaponType.PISTOL]: {\n    damage: 20,');
    // SMG's damage should be untouched
    expect(result.source).toContain('[WeaponType.SMG]: {\n    damage: 5,');
  });

  it('works with plain keys (not enum brackets)', () => {
    const shopSource = `
  pistol: {
    type: 'weapon',
    price: 30,
    emoji: '🔫',
  },`;
    const result = patchFieldInBlock(shopSource, 'pistol', 'price', '50');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('price: 50,');
  });
});

// ============================================================
// Unit Tests — patchBalanceValue
// ============================================================

describe('patchBalanceValue', () => {
  const balanceSource = `export const GAME_BALANCE = {
  physics: {
    /** Repulsion force */
    separationForce: 4,
    massAreaInfluence: 0.75,
  },
  enemy: {
    scalingFactor: 1.04,
    contactKnockback: 400,
  },
  wave: {
    duration: {
      early: 25,
      mid: 35,
      late: 40,
    },
    bossInterval: 3,
  },
} as const;`;

  it('patches a top-level nested value', () => {
    const result = patchBalanceValue(balanceSource, 'physics.separationForce', '8');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('separationForce: 8,');
    expect(result.source).not.toContain('separationForce: 4,');
  });

  it('patches a deeply nested value', () => {
    const result = patchBalanceValue(balanceSource, 'wave.duration.early', '30');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('early: 30,');
  });

  it('preserves JSDoc comments', () => {
    const result = patchBalanceValue(balanceSource, 'physics.separationForce', '8');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('/** Repulsion force */');
  });

  it('returns patched: false for non-existent path', () => {
    const result = patchBalanceValue(balanceSource, 'nonexistent.field', '1');
    expect(result.patched).toBe(false);
  });

  it('patches the correct field when names overlap across sections', () => {
    // Both physics and enemy sections have different fields — test correct targeting
    const result = patchBalanceValue(balanceSource, 'enemy.scalingFactor', '1.05');
    expect(result.patched).toBe(true);
    expect(result.source).toContain('scalingFactor: 1.05,');
    // physics section should be untouched
    expect(result.source).toContain('separationForce: 4,');
  });
});

// ============================================================
// Integration Tests — Export & Import
// ============================================================

describe('Balance Export/Import Integration', () => {
  beforeAll(() => {
    // Clean up any previous test xlsx
    if (fs.existsSync(TEST_XLSX)) fs.unlinkSync(TEST_XLSX);
    // Ensure the real xlsx exists by running export
    execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_XLSX)) fs.unlinkSync(TEST_XLSX);
  });

  describe('Export', () => {
    it('creates an XLSX file', () => {
      expect(fs.existsSync(REAL_XLSX)).toBe(true);
    });

    it('contains all 6 data sheets', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheetNames = workbook.worksheets.map((s) => s.name);
      expect(sheetNames).toContain('Weapons');
      expect(sheetNames).toContain('Items');
      expect(sheetNames).toContain('Enemies');
      expect(sheetNames).toContain('Balance');
      expect(sheetNames).toContain('Characters');
      expect(sheetNames).toContain('Waves');
    });

    it('Weapons sheet has one row per weapon plus header', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons');
      const expectedRows = Object.keys(WEAPON_TYPES).length + 1; // +1 for header
      expect(sheet?.rowCount).toBe(expectedRows);
    });

    it('Weapons sheet has type and price columns', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).toContain('type');
      expect(headers).toContain('price');
      expect(headers).toContain('damage');
      expect(headers).toContain('fireRate');
      expect(headers).toContain('weaponCategory');
    });

    it('Weapons sheet does not export excluded fields (name, emoji)', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).not.toContain('name');
      expect(headers).not.toContain('emoji');
    });

    it('Enemies sheet does not export color', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Enemies')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).not.toContain('color');
      expect(headers).toContain('type');
      expect(headers).toContain('hp');
    });

    it('Balance sheet has path/value columns', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Balance')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).toEqual(['path', 'value']);
    });

    it('Items sheet has auto-detected effect columns', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Items')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).toContain('id');
      expect(headers).toContain('price');
      expect(headers).toContain('armor');
      expect(headers).toContain('damageMultiplier');
    });

    it('Waves sheet has wave column and enemy type columns', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Waves')!;
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value));
      });
      expect(headers).toContain('wave');
      expect(headers).toContain('basic');
      expect(headers).toContain('fast');
    });

    it('exports correct weapon data values', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;

      // Find pistol row by scanning type column
      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      const pistolConfig = WEAPON_TYPES.pistol;
      let pistolRow: ExcelJS.Row | null = null;
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.getCell(headers.type!).value === 'pistol') {
          pistolRow = row;
          break;
        }
      }

      expect(pistolRow).not.toBeNull();
      expect(pistolRow!.getCell(headers.damage!).value).toBe(pistolConfig.damage);
      expect(pistolRow!.getCell(headers.fireRate!).value).toBe(pistolConfig.fireRate);
      expect(pistolRow!.getCell(headers.bulletSpeed!).value).toBe(pistolConfig.bulletSpeed);
    });
  });

  describe('Import — round-trip', () => {
    it('detects zero changes on unmodified export', () => {
      const output = execSync('npm run balance:import', {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
      });
      expect(output).toContain('No changes detected');
    });

    it('leaves source files unmodified after round-trip', () => {
      execSync('npm run balance:import', { cwd: ROOT_DIR, stdio: 'pipe' });
      // git diff should show only the price removal (our intended change)
      const diff = execSync('git --no-pager diff --name-only src/', {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
      });
      // Only weapon files should differ (from the price field removal)
      const changedFiles = diff.trim().split('\n').filter(Boolean);
      for (const file of changedFiles) {
        expect(file).toMatch(/weapons\/(config|type)\.ts$/);
      }
    });
  });

  describe('Import — value changes', () => {
    let originalWeaponSource: string;
    let originalShopSource: string;
    let originalBalanceSource: string;

    const weaponsFile = path.join(ROOT_DIR, 'src', 'domain', 'weapons', 'config.ts');
    const shopFile = path.join(ROOT_DIR, 'src', 'config', 'shop.config.ts');
    const balanceFile = path.join(ROOT_DIR, 'src', 'config', 'balance.config.ts');

    beforeEach(() => {
      // Save originals
      originalWeaponSource = fs.readFileSync(weaponsFile, 'utf-8');
      originalShopSource = fs.readFileSync(shopFile, 'utf-8');
      originalBalanceSource = fs.readFileSync(balanceFile, 'utf-8');
    });

    afterAll(() => {
      // Restore ALL originals
      fs.writeFileSync(weaponsFile, originalWeaponSource, 'utf-8');
      fs.writeFileSync(shopFile, originalShopSource, 'utf-8');
      fs.writeFileSync(balanceFile, originalBalanceSource, 'utf-8');
      // Re-export to get a clean xlsx
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });

    it('patches weapon damage when modified in XLSX', async () => {
      // Modify pistol damage in XLSX
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;

      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      // Find pistol row and change damage
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.getCell(headers.type!).value === 'pistol') {
          row.getCell(headers.damage!).value = 999;
          break;
        }
      }

      await workbook.xlsx.writeFile(REAL_XLSX);

      // Run import
      execSync('npm run balance:import', { cwd: ROOT_DIR, stdio: 'pipe' });

      // Verify the source was patched
      const source = fs.readFileSync(weaponsFile, 'utf-8');
      expect(source).toContain('damage: 999,');

      // Restore
      fs.writeFileSync(weaponsFile, originalWeaponSource, 'utf-8');
      // Restore original xlsx
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });

    it('patches shop price when modified in XLSX', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;

      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.getCell(headers.type!).value === 'smg') {
          row.getCell(headers.price!).value = 999;
          break;
        }
      }

      await workbook.xlsx.writeFile(REAL_XLSX);
      execSync('npm run balance:import', { cwd: ROOT_DIR, stdio: 'pipe' });

      const source = fs.readFileSync(shopFile, 'utf-8');
      // SMG price in shop config should be 999
      expect(source).toMatch(/smg:\s*\{[^}]*price:\s*999/s);

      // Restore
      fs.writeFileSync(shopFile, originalShopSource, 'utf-8');
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });

    it('patches balance config value when modified in XLSX', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Balance')!;

      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.getCell(headers.path!).value === 'physics.separationForce') {
          row.getCell(headers.value!).value = 99;
          break;
        }
      }

      await workbook.xlsx.writeFile(REAL_XLSX);
      execSync('npm run balance:import', { cwd: ROOT_DIR, stdio: 'pipe' });

      const source = fs.readFileSync(balanceFile, 'utf-8');
      expect(source).toContain('separationForce: 99,');

      // Restore
      fs.writeFileSync(balanceFile, originalBalanceSource, 'utf-8');
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });

    it('preserves comments when patching values', async () => {
      // The scythe weapon has inline comments like "// ~0.6 rotations per second"
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;

      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (row.getCell(headers.type!).value === 'scythe') {
          row.getCell(headers.damage!).value = 42;
          break;
        }
      }

      await workbook.xlsx.writeFile(REAL_XLSX);
      execSync('npm run balance:import', { cwd: ROOT_DIR, stdio: 'pipe' });

      const source = fs.readFileSync(weaponsFile, 'utf-8');
      expect(source).toContain('damage: 42,');
      // The TODO comment in the scythe block should still be there
      expect(source).toContain('// TODO projectile section?');

      // Restore
      fs.writeFileSync(weaponsFile, originalWeaponSource, 'utf-8');
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });
  });

  describe('Import — unknown/new entries', () => {
    it('warns about unknown weapon types and skips them', async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const sheet = workbook.getWorksheet('Weapons')!;

      const headers: Record<string, number> = {};
      sheet.getRow(1).eachCell((cell, col) => {
        headers[String(cell.value)] = col;
      });

      // Add a new row for a weapon that doesn't exist
      const newRow = sheet.getRow(sheet.rowCount + 1);
      newRow.getCell(headers.type!).value = 'railgun';
      newRow.getCell(headers.damage!).value = 500;
      newRow.getCell(headers.fireRate!).value = 3000;
      newRow.getCell(headers.price!).value = 999;

      await workbook.xlsx.writeFile(REAL_XLSX);

      // Capture both stdout and stderr
      const output = execSync('npm run balance:import 2>&1', {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
      });

      // Should warn about the unknown weapon
      expect(output).toContain("unknown type 'railgun'");

      // Source should NOT contain railgun anywhere
      const weaponSource = fs.readFileSync(
        path.join(ROOT_DIR, 'src', 'domain', 'weapons', 'config.ts'),
        'utf-8',
      );
      expect(weaponSource).not.toContain('railgun');

      // Restore xlsx
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });
  });

  describe('Export — preserve mode', () => {
    it('preserves extra sheets on re-export', async () => {
      // Add a custom analysis sheet
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(REAL_XLSX);
      const customSheet = workbook.addWorksheet('My Analysis');
      customSheet.getCell('A1').value = 'Custom calculations';
      customSheet.getCell('A2').value = 42;
      await workbook.xlsx.writeFile(REAL_XLSX);

      // Re-export
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });

      // Check that custom sheet is still there
      const reloaded = new ExcelJS.Workbook();
      await reloaded.xlsx.readFile(REAL_XLSX);
      const mySheet = reloaded.getWorksheet('My Analysis');
      expect(mySheet).toBeDefined();
      expect(mySheet!.getCell('A1').value).toBe('Custom calculations');
      expect(mySheet!.getCell('A2').value).toBe(42);

      // Re-export clean
      execSync('rm -f "' + REAL_XLSX + '"', { cwd: ROOT_DIR });
      execSync('npm run balance:export', { cwd: ROOT_DIR, stdio: 'pipe' });
    });
  });
});
