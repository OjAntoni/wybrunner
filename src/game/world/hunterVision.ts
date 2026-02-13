import type { Cell, Vec } from "../model/types";
import { inBounds } from "../utils/grid";

const LOS_EPSILON_TILES = 0.08;
const MAX_DISTANCE_EPSILON_TILES = 1e-6;

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
  if (maxDistanceTiles <= 0) return 0;

  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const EPSILON = 1e-9;

  const originCellX = Math.floor(origin.x);
  const originCellY = Math.floor(origin.y);
  if (!inBounds(originCellX, originCellY)) return 0;
  if (grid[originCellY][originCellX] === 1) return 0;

  const invAbsDirX =
    Math.abs(dirX) > EPSILON ? 1 / Math.abs(dirX) : Number.POSITIVE_INFINITY;
  const invAbsDirY =
    Math.abs(dirY) > EPSILON ? 1 / Math.abs(dirY) : Number.POSITIVE_INFINITY;
  const stepX = dirX >= 0 ? 1 : -1;
  const stepY = dirY >= 0 ? 1 : -1;

  let cellX = originCellX;
  let cellY = originCellY;
  let tMaxX = Number.POSITIVE_INFINITY;
  let tMaxY = Number.POSITIVE_INFINITY;

  if (invAbsDirX < Number.POSITIVE_INFINITY) {
    const nextBoundaryX = stepX > 0 ? cellX + 1 : cellX;
    tMaxX = (nextBoundaryX - origin.x) / dirX;
  }
  if (invAbsDirY < Number.POSITIVE_INFINITY) {
    const nextBoundaryY = stepY > 0 ? cellY + 1 : cellY;
    tMaxY = (nextBoundaryY - origin.y) / dirY;
  }

  while (true) {
    const advanceX = tMaxX <= tMaxY;
    const nextDistance = advanceX ? tMaxX : tMaxY;
    if (nextDistance > maxDistanceTiles) return maxDistanceTiles;

    if (advanceX) {
      cellX += stepX;
      tMaxX += invAbsDirX;
    } else {
      cellY += stepY;
      tMaxY += invAbsDirY;
    }

    if (!inBounds(cellX, cellY)) {
      return nextDistance;
    }
    if (grid[cellY][cellX] === 1) {
      return nextDistance;
    }
  }
}

export type VisionRaySample = {
  angle: number;
  distance: number;
  point: Vec;
  reachedMaxDistance: boolean;
};

export function sampleVisionConeRays(
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
  const rays: VisionRaySample[] = [];

  for (let i = 0; i <= safeRayCount; i += 1) {
    const t = i / safeRayCount;
    const angle = facingAngle - halfConeAngle + t * (halfConeAngle * 2);
    const distance = castVisionRayDistance(grid, hunter, angle, radiusTiles);
    rays.push({
      angle,
      distance,
      point: {
        x: hunter.x + Math.cos(angle) * distance,
        y: hunter.y + Math.sin(angle) * distance,
      },
      reachedMaxDistance: distance >= radiusTiles - MAX_DISTANCE_EPSILON_TILES,
    });
  }

  return rays;
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
  return sampleVisionConeRays(
    grid,
    hunter,
    hunterDirection,
    radiusTiles,
    coneAngleDeg,
    rayCount
  ).map((sample) => sample.point);
}
