import { defineConfig } from 'vite';
import { resolve } from 'path';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact({
      /**
       * Babel plugins required for TSyringe dependency injection.
       * - transform-typescript-metadata: Emits runtime type metadata for constructor params
       *   (enables TSyringe to auto-resolve class dependencies without @inject())
       * - plugin-proposal-decorators: Enables @singleton()/@injectable() decorator syntax
       *   (legacy: true required for compatibility with metadata reflection)
       */
      babel: {
        plugins: [
          'babel-plugin-transform-typescript-metadata',
          ['@babel/plugin-proposal-decorators', { legacy: true }],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: './', // Relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  // Define environment variables to replace at build time
  define: {
    __GAME_VERSION__: JSON.stringify(process.env.VITE_GAME_VERSION || 'dev'),
    __JSONBIN_BIN_ID__: JSON.stringify(process.env.VITE_JSONBIN_BIN_ID || ''),
    __JSONBIN_API_KEY__: JSON.stringify(process.env.VITE_JSONBIN_API_KEY || ''),
  },
});
