/**
 * Game version - automatically injected during build via Vite define
 * Falls back to 'dev' for local development
 */
export const GAME_VERSION = typeof __GAME_VERSION__ !== 'undefined' ? __GAME_VERSION__ : 'dev';
