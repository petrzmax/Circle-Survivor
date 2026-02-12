/**
 * Generic object pool for reusing frequently created/destroyed objects.
 * Minimizes garbage collection pressure by pre-allocating and recycling objects.
 *
 * @example
 * ```typescript
 * const pool = new ObjectPool<Particle>(
 *   () => ({ x: 0, y: 0, active: false }),
 *   (p) => { p.x = 0; p.y = 0; },
 *   100
 * );
 *
 * const particle = pool.acquire();
 * // ... use particle ...
 * pool.release(particle);
 * ```
 */

export interface Poolable {
  /** Whether this object is currently in use */
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private readonly items: T[] = [];
  private activeCount_: number = 0;

  /**
   * @param factory - Creates a new instance of T (with active = false)
   * @param reset - Resets an object to its default state when released
   * @param initialSize - Number of objects to pre-allocate
   */
  public constructor(
    private readonly factory: () => T,
    private readonly reset: (obj: T) => void,
    initialSize: number,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.items.push(this.factory());
    }
  }

  /**
   * Acquire an object from the pool.
   * Returns an inactive object if available, otherwise creates a new one.
   * The returned object has active = true.
   */
  public acquire(): T {
    // Find first inactive object
    for (const item of this.items) {
      if (!item.active) {
        item.active = true;
        this.activeCount_++;
        return item;
      }
    }

    // Pool exhausted — expand by creating a new object
    const item = this.factory();
    item.active = true;
    this.items.push(item);
    this.activeCount_++;
    return item;
  }

  /**
   * Release an object back to the pool.
   * Resets the object and marks it as inactive.
   */
  public release(obj: T): void {
    if (!obj.active) return;
    obj.active = false;
    this.reset(obj);
    this.activeCount_--;
  }

  /**
   * Iterate over all active objects.
   * Safe to call release() on objects during iteration when iterating backwards.
   */
  public forEachActive(callback: (obj: T, index: number) => void): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]!;
      if (item.active) {
        callback(item, i);
      }
    }
  }

  /**
   * Iterate over all active objects in forward order (for rendering).
   */
  public forEachActiveForward(callback: (obj: T) => void): void {
    for (const item of this.items) {
      if (item.active) {
        callback(item);
      }
    }
  }

  /** Number of currently active (in-use) objects */
  public get activeCount(): number {
    return this.activeCount_;
  }

  /** Total capacity (active + inactive) */
  public get capacity(): number {
    return this.items.length;
  }

  /**
   * Release all active objects (reset pool without deallocating)
   */
  public releaseAll(): void {
    for (const item of this.items) {
      if (item.active) {
        item.active = false;
        this.reset(item);
      }
    }
    this.activeCount_ = 0;
  }
}
