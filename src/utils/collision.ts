/**
 * Collision detection utilities.
 * Efficient collision checks for game entities.
 */

import { Vector2, clamp, distance, distanceSquared } from './math';
import type { CanvasBounds } from '@/types/common';

/**
 * Rectangle interface for collision detection
 */
export interface Rectangle {
  position: Vector2;
  width: number;
  height: number;
}

/**
 * Circle interface combining position and collider
 */
export interface Circle extends Vector2 {
  radius: number;
}

/**
 * Checks collision between two circles
 * Uses squared distance for performance (avoids sqrt)
 * @param a First circle (position + radius)
 * @param b Second circle (position + radius)
 * @returns True if circles overlap
 */
export function circleCollision(a: Circle, b: Circle): boolean {
  const combinedRadius = a.radius + b.radius;
  return distanceSquared(a, b) < combinedRadius * combinedRadius;
}

/**
 * Checks collision between rectangle and circle
 * @param rect Rectangle bounds
 * @param circle Circle (position + radius)
 * @returns True if rectangle and circle overlap
 */
export function rectCircleCollision(rect: Rectangle, circle: Circle): boolean {
  // Find the closest point on rectangle to circle center
  const closestX = clamp(circle.x, rect.position.x, rect.position.x + rect.width);
  const closestY = clamp(circle.y, rect.position.y, rect.position.y + rect.height);

  // Check if closest point is within circle radius
  const distX = circle.x - closestX;
  const distY = circle.y - closestY;

  return distX * distX + distY * distY < circle.radius * circle.radius;
}

/**
 * Checks if point is inside circle
 * @param point Point to check
 * @param circle Circle (position + radius)
 * @returns True if point is inside circle
 */
export function pointInCircle(point: Vector2, circle: Circle): boolean {
  return distanceSquared(point, circle) < circle.radius * circle.radius;
}

/**
 * Checks if point is inside rectangle
 * @param point Point to check
 * @param rect Rectangle bounds
 * @returns True if point is inside rectangle
 */
export function pointInRect(point: Vector2, rect: Rectangle): boolean {
  return (
    point.x >= rect.position.x &&
    point.x <= rect.position.x + rect.width &&
    point.y >= rect.position.y &&
    point.y <= rect.position.y + rect.height
  );
}

/**
 * Checks if circle is fully inside rectangle bounds
 * Useful for checking if entity is within game area
 * @param circle Circle to check
 * @param rect Rectangle bounds
 * @returns True if circle is fully inside rectangle
 */
export function circleInRect(circle: Circle, rect: Rectangle): boolean {
  return (
    circle.x - circle.radius >= rect.position.x &&
    circle.x + circle.radius <= rect.position.x + rect.width &&
    circle.y - circle.radius >= rect.position.y &&
    circle.y + circle.radius <= rect.position.y + rect.height
  );
}

/**
 * Checks if circle is partially outside rectangle bounds
 * @param circle Circle to check
 * @param rect Rectangle bounds
 * @returns True if any part of circle is outside rectangle
 */
export function circleOutsideRect(circle: Circle, rect: Rectangle): boolean {
  return (
    circle.x - circle.radius < rect.position.x ||
    circle.x + circle.radius > rect.position.x + rect.width ||
    circle.y - circle.radius < rect.position.y ||
    circle.y + circle.radius > rect.position.y + rect.height
  );
}

/**
 * Checks collision between two rectangles
 * @param a First rectangle
 * @param b Second rectangle
 * @returns True if rectangles overlap
 */
export function rectCollision(a: Rectangle, b: Rectangle): boolean {
  return (
    a.position.x < b.position.x + b.width &&
    a.position.x + a.width > b.position.x &&
    a.position.y < b.position.y + b.height &&
    a.position.y + a.height > b.position.y
  );
}

/**
 * Gets the overlap depth between two circles
 * Useful for collision response (pushing entities apart)
 * @param a First circle
 * @param b Second circle
 * @returns Overlap depth (positive if overlapping, negative if not)
 */
export function circleOverlapDepth(a: Circle, b: Circle): number {
  const dist = distance(a, b);
  return a.radius + b.radius - dist;
}

/**
 * Clamps a circle position to stay fully inside a rectangle.
 * Returns the clamped position.
 */
export function clampCircleToRect(circle: Circle, rect: Rectangle): Vector2 {
  return {
    x: clamp(
      circle.x,
      rect.position.x + circle.radius,
      rect.position.x + rect.width - circle.radius,
    ),
    y: clamp(
      circle.y,
      rect.position.y + circle.radius,
      rect.position.y + rect.height - circle.radius,
    ),
  };
}

const ORIGIN: Vector2 = { x: 0, y: 0 };

/**
 * Checks if circle is fully inside origin-based bounds (0,0 to width,height).
 */
export function circleInBounds(pos: Vector2, radius: number, bounds: CanvasBounds): boolean {
  return circleInRect(
    { ...pos, radius },
    { position: ORIGIN, width: bounds.width, height: bounds.height },
  );
}

/**
 * Clamps a circle to stay fully inside origin-based bounds (0,0 to width,height).
 * Returns the clamped position.
 */
export function clampCircleToBounds(pos: Vector2, radius: number, bounds: CanvasBounds): Vector2 {
  return clampCircleToRect(
    { ...pos, radius },
    { position: ORIGIN, width: bounds.width, height: bounds.height },
  );
}
