import { render, JSX } from 'preact';
import { App } from './App';

/**
 * Mount Preact UI to #ui-root
 * The App component is self-contained and listens to EventBus for all state updates
 */
export function mountUI(): void {
  const root = document.getElementById('ui-root');

  if (root) {
    render(<App />, root);
  }
}

/**
 * Unmount UI (for cleanup)
 */
export function unmountUI(): void {
  const root = document.getElementById('ui-root');
  if (root) {
    // TODO hmm verify, weird
    render(null as unknown as JSX.Element, root);
  }
}
