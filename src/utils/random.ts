/**
 * Random number utilities.
 * Provides controlled randomness for game mechanics.
 */

import { Vector2 } from './math';

/**
 * Generates random float in range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 * @returns Random float
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates random integer in range [min, max] (inclusive)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns true with given probability
 * @param chance Probability (0-1)
 * @returns True if random check succeeds
 */
export function randomChance(chance: number): boolean {
  return Math.random() < chance;
}

/**
 * Picks random element from array
 * @param array Array to pick from
 * @returns Random element or undefined if array is empty
 */
export function randomElement<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[randomInt(0, array.length - 1)];
}

/**
 * Picks random element from array (throws if empty)
 * @param array Array to pick from (must not be empty)
 * @returns Random element
 * @throws Error if array is empty
 */
export function randomElementStrict<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot pick random element from empty array');
  }
  return array[randomInt(0, array.length - 1)] as T;
}

/**
 * Shuffles array in place using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns Same array, shuffled
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const temp = array[i] as T;
    array[i] = array[j] as T;
    array[j] = temp;
  }
  return array;
}

/**
 * Returns shuffled copy of array (original unchanged)
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export function shuffledCopy<T>(array: readonly T[]): T[] {
  return shuffleArray([...array]);
}

/**
 * Generates random point on circle edge
 * @param center Center of circle
 * @param radius Radius of circle
 * @returns Random point on circle edge
 */
export function randomPointOnCircle(center: Vector2, radius: number): Vector2 {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

/**
 * Generates random point inside circle
 * @param center Center of circle
 * @param radius Radius of circle
 * @returns Random point inside circle (uniform distribution)
 */
export function randomPointInCircle(center: Vector2, radius: number): Vector2 {
  // Use sqrt for uniform distribution
  const r = radius * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  return {
    x: center.x + Math.cos(angle) * r,
    y: center.y + Math.sin(angle) * r,
  };
}

/**
 * Generates random angle in radians
 * @returns Random angle [0, 2π)
 */
export function randomAngle(): number {
  return Math.random() * Math.PI * 2;
}

/**
 * Generates random unit vector (length = 1)
 * @returns Random direction vector
 */
export function randomDirection(): Vector2 {
  const angle = randomAngle();
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

/**
 * Canvas bounds interface
 */
export interface CanvasBounds {
  width: number;
  height: number;
}

/**
 * Screen side enum for spawn positioning
 */
export enum ScreenSide {
  TOP = 0,
  RIGHT = 1,
  BOTTOM = 2,
  LEFT = 3,
}

/**
 * Generates spawn point outside screen bounds
 * @param canvas Canvas dimensions
 * @param margin Distance outside screen to spawn
 * @returns Spawn position outside visible area
 */
export function getSpawnPoint(canvas: CanvasBounds, margin: number = 50): Vector2 {
  const side = randomInt(0, 3) as ScreenSide;

  switch (side) {
    case ScreenSide.TOP:
      return { x: randomRange(0, canvas.width), y: -margin };
    case ScreenSide.RIGHT:
      return { x: canvas.width + margin, y: randomRange(0, canvas.height) };
    case ScreenSide.BOTTOM:
      return { x: randomRange(0, canvas.width), y: canvas.height + margin };
    case ScreenSide.LEFT:
      return { x: -margin, y: randomRange(0, canvas.height) };
  }
}

/**
 * Generates spawn point on specific side of screen
 * @param canvas Canvas dimensions
 * @param side Which side to spawn on
 * @param margin Distance outside screen to spawn
 * @returns Spawn position on specified side
 */
export function getSpawnPointOnSide(
  canvas: CanvasBounds,
  side: ScreenSide,
  margin: number = 50,
): Vector2 {
  switch (side) {
    case ScreenSide.TOP:
      return { x: randomRange(0, canvas.width), y: -margin };
    case ScreenSide.RIGHT:
      return { x: canvas.width + margin, y: randomRange(0, canvas.height) };
    case ScreenSide.BOTTOM:
      return { x: randomRange(0, canvas.width), y: canvas.height + margin };
    case ScreenSide.LEFT:
      return { x: -margin, y: randomRange(0, canvas.height) };
  }
}

/**
 * Generates random point inside rectangle
 * @param x Left edge
 * @param y Top edge
 * @param width Width of rectangle
 * @param height Height of rectangle
 * @returns Random point inside rectangle
 */
export function randomPointInRect(x: number, y: number, width: number, height: number): Vector2 {
  return {
    x: randomRange(x, x + width),
    y: randomRange(y, y + height),
  };
}

/**
 * Weighted random selection
 * @param items Items to choose from
 * @param weights Weight for each item (higher = more likely)
 * @returns Selected item
 */
export function weightedRandom<T>(items: readonly T[], weights: readonly number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have same length');
  }
  if (items.length === 0) {
    throw new Error('Cannot select from empty array');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      return items[i] as T;
    }
  }

  // Fallback (should not reach here)
  return items[items.length - 1] as T;
}
