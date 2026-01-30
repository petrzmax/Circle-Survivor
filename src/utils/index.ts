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
  circleInRect,
  circleOutsideRect,
  circleOverlapDepth,
  entityCollision,
  pointInCircle,
  pointInRect,
  rectCircleCollision,
  rectCollision,
  type Circle,
  type Rectangle,
} from './collision';

export { getEnemyDisplayName } from './format';

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
  type CanvasBounds,
} from './random';
