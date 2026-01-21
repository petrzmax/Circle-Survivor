/**
 * UI module exports
 */

// TODO Legacy exports (to be removed after Preact migration)
export { Shop } from '@/systems/Shop';
export type { ShopPlayer, ShopWeapon } from '@/systems/Shop';

export { Leaderboard } from './Leaderboard';
export type { LeaderboardEntry } from './Leaderboard';

export { LeaderboardUI } from './LeaderboardUI';

// Preact UI mount function
export { mountUI, unmountUI } from './mount';
