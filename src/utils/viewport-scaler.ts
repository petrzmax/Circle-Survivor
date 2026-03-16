/**
 * ViewportScaler - Scales #game-container via CSS transform to fit any screen.
 * Preserves the internal 900×700 canvas resolution.
 */

const CONTAINER_WIDTH = 906; // 900 + 2×3px border
const CONTAINER_HEIGHT = 706; // 700 + 2×3px border

export class ViewportScaler {
  private container: HTMLElement;

  public constructor() {
    this.container = document.getElementById('game-container')!;
    this.applyBaseStyles();
    this.rescale();
    window.addEventListener('resize', () => {
      this.rescale();
    });
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

    this.container.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
}
