/**
 * Main entry point for Circle Survivor game
 * Initializes the game when page loads
 */

import { Game } from '@/core/Game';
import { GAME_VERSION } from '@/version';

// Start when page loads
window.addEventListener('load', () => {
  // Set version number
  const versionElement = document.getElementById('version-number');
  if (versionElement) {
    versionElement.textContent = GAME_VERSION;
  }

  // Initialize game
  new Game();
});
