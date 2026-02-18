// Parallel vision ray casting using Web Workers
// Falls back to synchronous execution for small batches or when workers unavailable

import type { Cell, Vec } from '../model/types';
import { inBounds } from '../utils/grid';
import { getWorkerPool } from '../workers/workerPool';

const PARALLEL_THRESHOLD = 16; // Minimum ray count to use workers
let parallelEnabled = true;

// Flatten grid for efficient transfer to workers
function flattenGrid(grid: Cell[][]): Uint8Array {
  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;
  const flat = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      flat[y * width + x] = grid[y][x];
    }
  }
  
  return flat;
}

// Cached flattened grid
let cachedFlatGrid: Uint8Array | null = null;
let cachedGridRef: Cell[][] | null = null;

function getFlatGrid(grid: Cell[][]): Uint8Array {
  if (cachedGridRef !== grid || !cachedFlatGrid) {
    cachedFlatGrid = flattenGrid(grid);
    cachedGridRef = grid;
  }
  return cachedFlatGrid;
}

export function clearGridCache(): void {
  cachedFlatGrid = null;
  cachedGridRef = null;
}

export type VisionRaySample = {
  angle: number;
  distance: number;
  point: Vec;
  reachedMaxDistance: boolean;
};

// Direction to angle conversion
function directionToAngle(direction: Vec): number {
  if (direction.x === 0 && direction.y === 0) return 0;
  return Math.atan2(direction.y, direction.x);
}

// Main parallel ray casting function
export async function sampleVisionConeRaysParallel(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  radiusTiles: number,
  coneAngleDeg: number,
  rayCount: number
): Promise<VisionRaySample[]> {
  // Use synchronous version for small batches
  if (!parallelEnabled || rayCount < PARALLEL_THRESHOLD) {
    return sampleVisionConeRaysSync(grid, hunter, hunterDirection, radiusTiles, coneAngleDeg, rayCount);
  }

  try {
    const pool = await getWorkerPool();
    const flatGrid = getFlatGrid(grid);
    const width = grid[0]?.length || 0;
    const height = grid.length;
    const facingAngle = directionToAngle(hunterDirection);

    // Split rays into chunks for parallel processing
    const numChunks = Math.min(4, Math.ceil(rayCount / 8)); // Max 4 chunks
    const raysPerChunk = Math.ceil(rayCount / numChunks);
    const halfConeAngle = (coneAngleDeg * Math.PI) / 360;

    const chunkPromises: Promise<VisionRaySample[]>[] = [];

    for (let chunk = 0; chunk < numChunks; chunk++) {
      const startIdx = chunk * raysPerChunk;
      const endIdx = Math.min(startIdx + raysPerChunk, rayCount);
      const chunkRayCount = endIdx - startIdx;
      
      if (chunkRayCount <= 0) continue;

      const chunkStartAngle = facingAngle - halfConeAngle + (startIdx / (rayCount - 1)) * (halfConeAngle * 2);
      const chunkEndAngle = facingAngle - halfConeAngle + ((endIdx - 1) / (rayCount - 1)) * (halfConeAngle * 2);

      const promise = pool
        .castVisionCone(
          flatGrid,
          width,
          height,
          hunter.x,
          hunter.y,
          (chunkStartAngle + chunkEndAngle) / 2, // Center angle
          coneAngleDeg / numChunks, // Subdivide cone angle
          radiusTiles,
          chunkRayCount
        )
        .then((rays: Array<{ angle: number; distance: number; pointX: number; pointY: number; reachedMax: boolean }>) =>
          rays.map((r: { angle: number; distance: number; pointX: number; pointY: number; reachedMax: boolean }) => ({
            angle: r.angle,
            distance: r.distance,
            point: { x: r.pointX, y: r.pointY },
            reachedMaxDistance: r.reachedMax,
          }))
        )
        .catch(() => {
          // Fallback to sync on error
          const startAngle = chunkStartAngle;
          const endAngle = chunkEndAngle;
          const samples: VisionRaySample[] = [];
          
          for (let i = 0; i < chunkRayCount; i++) {
            const t = chunkRayCount <= 1 ? 0 : i / (chunkRayCount - 1);
            const angle = startAngle + t * (endAngle - startAngle);
            const distance = castVisionRayDistance(grid, hunter, angle, radiusTiles);
            samples.push({
              angle,
              distance,
              point: {
                x: hunter.x + Math.cos(angle) * distance,
                y: hunter.y + Math.sin(angle) * distance,
              },
              reachedMaxDistance: distance >= radiusTiles - 1e-6,
            });
          }
          return samples;
        });

      chunkPromises.push(promise);
    }

    const results = await Promise.all(chunkPromises);
    return results.flat();
  } catch {
    // Fallback to synchronous execution
    return sampleVisionConeRaysSync(grid, hunter, hunterDirection, radiusTiles, coneAngleDeg, rayCount);
  }
}

// Synchronous DDA ray casting (fallback)
export function castVisionRayDistance(
  grid: Cell[][],
  origin: Vec,
  angle: number,
  maxDistanceTiles: number
): number {
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

// Synchronous version for small batches or fallback
export function sampleVisionConeRaysSync(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  radiusTiles: number,
  coneAngleDeg: number,
  rayCount: number
): VisionRaySample[] {
  const facingAngle = directionToAngle(hunterDirection);
  const halfConeAngle = (coneAngleDeg * Math.PI) / 360;
  const safeRayCount = Math.max(2, rayCount);
  const rays: VisionRaySample[] = [];

  for (let i = 0; i < safeRayCount; i++) {
    const t = i / (safeRayCount - 1);
    const angle = facingAngle - halfConeAngle + t * (halfConeAngle * 2);
    const distance = castVisionRayDistance(grid, hunter, angle, radiusTiles);
    rays.push({
      angle,
      distance,
      point: {
        x: hunter.x + Math.cos(angle) * distance,
        y: hunter.y + Math.sin(angle) * distance,
      },
      reachedMaxDistance: distance >= radiusTiles - 1e-6,
    });
  }

  return rays;
}

// Check target visibility (always synchronous - single ray)
export function isTargetVisibleInVisionCone(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  target: Vec,
  radiusTiles: number,
  coneAngleDeg: number
): boolean {
  const toTargetX = target.x - hunter.x;
  const toTargetY = target.y - hunter.y;
  const targetDistance = Math.hypot(toTargetX, toTargetY);
  if (targetDistance > radiusTiles) return false;
  if (targetDistance <= 0.001) return true;

  const facingAngle = directionToAngle(hunterDirection);
  const targetAngle = Math.atan2(toTargetY, toTargetX);
  const halfConeAngle = (coneAngleDeg * Math.PI) / 360;
  
  // Check angle difference
  let delta = targetAngle - facingAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  
  if (Math.abs(delta) > halfConeAngle) return false;

  const visibleDistance = castVisionRayDistance(grid, hunter, targetAngle, radiusTiles);
  return targetDistance <= visibleDistance + 0.08; // LOS_EPSILON_TILES
}

// Get boundary points for rendering
export function sampleVisionConeBoundary(
  grid: Cell[][],
  hunter: Vec,
  hunterDirection: Vec,
  radiusTiles: number,
  coneAngleDeg: number,
  rayCount: number
): Vec[] {
  return sampleVisionConeRaysSync(
    grid,
    hunter,
    hunterDirection,
    radiusTiles,
    coneAngleDeg,
    rayCount
  ).map((sample) => sample.point);
}

// Configuration
export function setParallelEnabled(enabled: boolean): void {
  parallelEnabled = enabled;
}

export function isParallelEnabled(): boolean {
  return parallelEnabled;
}
