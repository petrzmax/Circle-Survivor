/**
 * Character type definitions.
 * Each character has unique starting stats and playstyle.
 */

import { CharacterType, WeaponType } from '@/types/enums';

/**
 * Character configuration interface
 */
export interface CharacterConfig {
  name: string;
  description: string;
  color: string;
  maxHp: number;
  speed: number;
  damageMultiplier: number;
  goldMultiplier: number;
  startingWeapon: WeaponType;
}

export const CHARACTER_TYPES: Record<CharacterType, CharacterConfig> = {
  [CharacterType.WYPALENIEC]: {
    name: 'Wypaleniec',
    description: 'Były pracownik korpo. Wypalony, ale wściekły.',
    color: '#ff6600',
    maxHp: 80,
    speed: 3.2, // -20%
    damageMultiplier: 1.2, // +20%
    goldMultiplier: 1,
    startingWeapon: WeaponType.SHOTGUN,
  },
  [CharacterType.CWANIAK]: {
    name: 'Cwaniak',
    description: 'Zawsze znajdzie lukę w systemie.',
    color: '#00ff88',
    maxHp: 70,
    speed: 4.8, // +20%
    damageMultiplier: 1,
    goldMultiplier: 1.15, // +15%
    startingWeapon: WeaponType.SMG,
  },
  [CharacterType.NORMIK]: {
    name: 'Normik',
    description: 'Przeciętny Kowalski. Zbalansowany we wszystkim.',
    color: '#4a9eff',
    maxHp: 100,
    speed: 4,
    damageMultiplier: 1,
    goldMultiplier: 1,
    startingWeapon: WeaponType.PISTOL,
  },
} as const;
