/**
 * Main entry point for Circle Survivor game
 * Initializes the game when page loads
 */

import { Game } from '@/core/Game';
import { GAME_VERSION } from '@/version';
import { mountUI } from '@/ui';

// Start when page loads
window.addEventListener('load', () => {
  // Set version number and link to GitHub release
  const versionElement = document.getElementById('version-number') as HTMLAnchorElement | null;
  if (versionElement) {
    versionElement.textContent = GAME_VERSION;
    // Link to specific release tag if not dev version
    if (GAME_VERSION !== 'dev') {
      versionElement.href = `https://github.com/petrzmax/Circle-Survivor/releases/tag/v${GAME_VERSION}`;
    }
  }

  // Mount Preact UI layer
  mountUI();

  // Initialize game
  new Game();
});
