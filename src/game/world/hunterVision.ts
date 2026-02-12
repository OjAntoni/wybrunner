import type { Cell, Vec } from "../model/types";
import { inBounds } from "../utils/grid";

const VISION_RAY_STEP_TILES = 0.05;
const LOS_EPSILON_TILES = 0.08;

function directionToAngle(direction: Vec) {
  if (direction.x === 0 && direction.y === 0) return 0;
  return Math.atan2(direction.y, direction.x);
}

function shortestAngleDelta(a: number, b: number) {
  let delta = a - b;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta);
}

export function castVisionRayDistance(
  grid: Cell[][],
  origin: Vec,
  angle: number,
  maxDistanceTiles: number
) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let distance = 0;

  while (distance < maxDistanceTiles) {
    const nextDistance = Math.min(maxDistanceTiles, distance + VISION_RAY_STEP_TILES);
    const sampleX = origin.x + dirX * nextDistance;
    const sampleY = origin.y + dirY * nextDistance;
    const cellX = Math.floor(sampleX);
    const cellY = Math.floor(sampleY);
    if (!inBounds(cellX, cellY)) return distance;
    if (grid[cellY][cellX] === 1) return distance;
    distance = nextDistance;
  }

  return maxDistanceTiles;
}

export function isTargetVisibleInVisionCone(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  target: Vec,
  radiusTiles: number,
  coneAngleDeg: number
) {
  const toTargetX = target.x - hunter.x;
  const toTargetY = target.y - hunter.y;
  const targetDistance = Math.hypot(toTargetX, toTargetY);
  if (targetDistance > radiusTiles) return false;
  if (targetDistance <= 0.001) return true;

  const facingAngle = directionToAngle(hunterDirection);
  const targetAngle = Math.atan2(toTargetY, toTargetX);
  const halfConeAngle = (coneAngleDeg * Math.PI) / 360;
  if (shortestAngleDelta(targetAngle, facingAngle) > halfConeAngle) return false;

  const visibleDistance = castVisionRayDistance(grid, hunter, targetAngle, radiusTiles);
  return targetDistance <= visibleDistance + LOS_EPSILON_TILES;
}

export function sampleVisionConeBoundary(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  radiusTiles: number,
  coneAngleDeg: number,
  rayCount: number
) {
  const facingAngle = directionToAngle(hunterDirection);
  const halfConeAngle = (coneAngleDeg * Math.PI) / 360;
  const safeRayCount = Math.max(2, rayCount);
  const points: Vec[] = [];

  for (let i = 0; i <= safeRayCount; i += 1) {
    const t = i / safeRayCount;
    const angle = facingAngle - halfConeAngle + t * (halfConeAngle * 2);
    const rayDistance = castVisionRayDistance(grid, hunter, angle, radiusTiles);
    points.push({
      x: hunter.x + Math.cos(angle) * rayDistance,
      y: hunter.y + Math.sin(angle) * rayDistance,
    });
  }

  return points;
}
