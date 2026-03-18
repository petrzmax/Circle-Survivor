/**
 * Utils exports barrel file.
 * Import all utilities from this single entry point.
 */

export {
  addVectors,
  angleBetween,
  clamp,
  copyVector,
  degreesToRadians,
  directionTo,
  distance,
  distanceSquared,
  dotProduct,
  lerp,
  lerpVector,
  magnitude,
  massFromRadius,
  normalize,
  radiansToDegrees,
  rotateVector,
  scaleVector,
  subtractVectors,
  vectorFromAngle,
  type Vector2,
} from './math';

export {
  circleCollision,
  circleInBounds,
  circleInRect,
  circleOutsideRect,
  circleOverlapDepth,
  clampCircleToBounds,
  clampCircleToRect,
  pointInCircle,
  pointInRect,
  rectCircleCollision,
  rectCollision,
  type Circle,
  type Rectangle,
} from './collision';

export { getEnemyDisplayName } from './format';

export { ViewportScaler } from './viewport-scaler';

export {
  ScreenSide,
  getSpawnPoint,
  getSpawnPointOnSide,
  randomAngle,
  randomChance,
  randomDirection,
  randomElement,
  randomElementStrict,
  randomInt,
  randomPointInCircle,
  randomPointInRect,
  randomPointOnCircle,
  randomRange,
  shuffleArray,
  shuffledCopy,
  weightedRandom,
} from './random';

export { type CanvasBounds } from '@/types/common';

export { ObjectPool, type Poolable } from './object-pool';
