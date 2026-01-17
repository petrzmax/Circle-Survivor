/**
 * Main entry point for Circle Survivor game
 * Initializes the game when page loads
 */

import { Game } from '@/core/Game';
import { mountUI } from '@/ui';

// Start when page loads
window.addEventListener('load', () => {
  // Mount Preact UI layer
  mountUI();

  // Initialize game
  new Game();
});
