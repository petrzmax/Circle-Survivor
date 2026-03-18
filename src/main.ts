/**
 * Main entry point for Circle Survivor game
 * Initializes the game when page loads
 */

import 'reflect-metadata';
import { Game } from '@/core/Game';
import { mountUI } from '@/ui';
import { ViewportScaler } from '@/utils/viewport-scaler';
import { container } from 'tsyringe';

function setupFullscreenToggle(scaler: ViewportScaler): void {
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;

  // iOS Safari doesn't support Fullscreen API — hide the button entirely
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- not available on iOS Safari despite TS types
  if (!document.documentElement.requestFullscreen) {
    btn.style.display = 'none';
    return;
  }

  btn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().then(() => {
        scaler.rescale();
      });
    } else {
      void document.documentElement.requestFullscreen().then(() => {
        scaler.rescale();
      });
    }
  });
}

// Start when page loads
window.addEventListener('load', () => {
  // Scale game container to fit viewport
  const scaler = new ViewportScaler();
  setupFullscreenToggle(scaler);

  // Mount Preact UI layer
  mountUI();

  // Initialize game via DI container
  container.resolve(Game);

  // Remove loading screen once game is ready
  document.getElementById('loading-screen')?.remove();
});
