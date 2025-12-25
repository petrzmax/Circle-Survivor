/**
 * Math utility functions.
 * Common mathematical operations for game calculations.
 */

import { ITransform } from '@/types/components';

export const TWO_PI = Math.PI * 2;

/**
 * 2D Vector interface
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Calculates Euclidean distance between two points
 * @param a First point
 * @param b Second point
 * @returns Distance between points
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates squared distance (faster, no sqrt)
 * Use for distance comparisons where exact value isn't needed
 * @param a First point
 * @param b Second point
 * @returns Squared distance
 */
export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Normalizes a vector to unit length
 * @param vector Vector to normalize
 * @returns Normalized vector (length = 1) or zero vector if input is zero
 */
export function normalize(vector: Vector2): Vector2 {
  const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: vector.x / mag, y: vector.y / mag };
}

/**
 * Calculates magnitude (length) of a vector
 * @param vector Vector to measure
 * @returns Length of vector
 */
export function magnitude(vector: Vector2): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/**
 * Adds two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Sum vector
 */
export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtracts second vector from first
 * @param a First vector
 * @param b Second vector
 * @returns Difference vector (a - b)
 */
export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiplies vector by scalar
 * @param vector Vector to scale
 * @param scalar Scalar value
 * @returns Scaled vector
 */
export function scaleVector(vector: Vector2, scalar: number): Vector2 {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

/**
 * Clamps a value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two vectors
 * @param a Start vector
 * @param b End vector
 * @param t Interpolation factor (0-1)
 * @returns Interpolated vector
 */
export function lerpVector(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

/**
 * Calculates angle from one point to another
 * @param from Source point
 * @param to Target point
 * @returns Angle in radians
 */
export function angleBetween(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Creates a vector from angle and magnitude
 * @param angle Angle in radians
 * @param magnitude Length of vector
 * @returns Vector pointing in direction of angle
 */
export function vectorFromAngle(angle: number, mag: number = 1): Vector2 {
  return {
    x: Math.cos(angle) * mag,
    y: Math.sin(angle) * mag,
  };
}

/**
 * Calculates dot product of two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Dot product
 */
export function dotProduct(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Rotates a vector by given angle
 * @param vector Vector to rotate
 * @param angle Angle in radians
 * @returns Rotated vector
 */
export function rotateVector(vector: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/**
 * Gets direction vector from transform to target position
 * @param transform Source transform
 * @param target Target position
 * @returns Normalized direction vector
 */
export function directionTo(transform: ITransform, target: Vector2): Vector2 {
  return normalize(subtractVectors(target, transform));
}
