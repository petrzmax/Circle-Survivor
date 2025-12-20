import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
