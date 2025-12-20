/// <reference types="vite/client" />

/**
 * Global constants injected by Vite at build time
 */
declare const __GAME_VERSION__: string;
declare const __JSONBIN_BIN_ID__: string;
declare const __JSONBIN_API_KEY__: string;

/**
 * Vite environment variables interface
 */
interface ImportMetaEnv {
  readonly VITE_GAME_VERSION: string;
  readonly VITE_JSONBIN_BIN_ID: string;
  readonly VITE_JSONBIN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
