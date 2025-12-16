/**
 * Utils exports barrel file.
 * Import all utilities from this single entry point.
 */

export {
  type Vector2,
  distance,
  distanceSquared,
  normalize,
  magnitude,
  addVectors,
  subtractVectors,
  scaleVector,
  clamp,
  lerp,
  lerpVector,
  angleBetween,
  degreesToRadians,
  radiansToDegrees,
  vectorFromAngle,
  dotProduct,
  rotateVector,
  directionTo,
} from './math';

export {
  type Rectangle,
  type Circle,
  circleCollision,
  entityCollision,
  rectCircleCollision,
  pointInCircle,
  pointInRect,
  circleInRect,
  circleOutsideRect,
  rectCollision,
  circleOverlapDepth,
} from './collision';

export {
  randomRange,
  randomInt,
  randomChance,
  randomElement,
  randomElementStrict,
  shuffleArray,
  shuffledCopy,
  randomPointOnCircle,
  randomPointInCircle,
  randomAngle,
  randomDirection,
  type CanvasBounds,
  ScreenSide,
  getSpawnPoint,
  getSpawnPointOnSide,
  randomPointInRect,
  weightedRandom,
} from './random';
