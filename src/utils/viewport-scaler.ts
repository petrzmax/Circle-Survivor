/**
 * ViewportScaler - Scales #game-container via CSS transform to fit any screen.
 * Preserves the internal canvas resolution.
 */

import {
  BORDER_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CONTAINER_HEIGHT,
  CONTAINER_WIDTH,
} from '@/config/layout.config';

export {
  CONTAINER_HEIGHT,
  CONTAINER_WIDTH,
  TOOLTIP_OFFSET,
  TOOLTIP_WIDTH,
} from '@/config/layout.config';

export interface LocalPosition {
  x: number;
  y: number;
}

export class ViewportScaler {
  private container: HTMLElement;
  private static containerElement: HTMLElement;

  /** Current scale factor applied to game-container */
  private static currentScale = 1;

  public static getScale(): number {
    return ViewportScaler.currentScale;
  }

  /**
   * Convert viewport (clientX/clientY) coordinates to container-local coordinates.
   * Needed because CSS transform makes the container the containing block for fixed-position children.
   */
  public static viewportToLocal(clientX: number, clientY: number): LocalPosition {
    const rect = ViewportScaler.containerElement.getBoundingClientRect();
    const scale = ViewportScaler.currentScale;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }

  public constructor() {
    this.container = document.getElementById('game-container')!;
    ViewportScaler.containerElement = this.container;
    this.applyCssProperties();
    this.applyBaseStyles();
    this.rescale();
    window.addEventListener('resize', () => {
      this.rescale();
    });
  }

  /**
   * Set CSS custom properties so CSS can derive dimensions from the same source of truth.
   */
  private applyCssProperties(): void {
    const root = document.documentElement.style;
    root.setProperty('--canvas-width', `${CANVAS_WIDTH}px`);
    root.setProperty('--canvas-height', `${CANVAS_HEIGHT}px`);
    root.setProperty('--border-width', `${BORDER_WIDTH}px`);
    root.setProperty('--container-width', `${CONTAINER_WIDTH}px`);
    root.setProperty('--container-height', `${CONTAINER_HEIGHT}px`);
  }

  /**
   * Set positioning styles needed for transform-origin scaling to work.
   * Applied once — overrides the fixed centering from CSS on small screens.
   */
  private applyBaseStyles(): void {
    const el = this.container.style;
    el.position = 'absolute';
    el.left = '50%';
    el.top = '50%';
    el.transformOrigin = 'center center';
  }

  /**
   * Calculate scale factor and apply CSS transform.
   * Called on load, resize, orientation change, and fullscreen toggle.
   */
  public rescale(): void {
    const scaleX = window.innerWidth / CONTAINER_WIDTH;
    const scaleY = window.innerHeight / CONTAINER_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1); // Never upscale beyond 1

    ViewportScaler.currentScale = scale;
    this.container.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}
