/**
 * Config exports barrel file.
 * Import all configs from this single entry point.
 */

export { GAME_BALANCE } from './balance.config';
export { WEAPON_TYPES, type WeaponConfig } from './weapons.config';
export {
  ENEMY_TYPES,
  BOSS_NAME_PREFIXES,
  BOSS_NAME_SUFFIXES,
  generateBossName,
  type EnemyConfig,
  type AttackPattern,
} from './enemies.config';
export { CHARACTER_TYPES, type CharacterConfig } from './characters.config';
export {
  SHOP_ITEMS,
  type ShopItem,
  type WeaponShopItem,
  type StatShopItem,
  type WeaponBonusShopItem,
  type ItemEffect,
  type ShopItemType,
} from './shop.config';
export {
  SOUND_DEFINITIONS,
  type OscillatorType,
  type ToneDefinition,
  type NoiseDefinition,
  type SoundStep,
  type SoundDefinition,
} from './sounds.config';
