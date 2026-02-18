// Web Worker for parallel vision ray casting
// This worker handles computationally expensive DDA ray casting off the main thread

export type RayCastTask = {
  type: 'castRays';
  grid: Uint8Array; // Flattened grid data
  gridWidth: number;
  gridHeight: number;
  originX: number;
  originY: number;
  startAngle: number;
  endAngle: number;
  maxDistance: number;
  rayCount: number;
  id: number; // Task ID for correlation
};

export type RayCastResult = {
  type: 'rayResults';
  id: number;
  rays: Array<{
    angle: number;
    distance: number;
    pointX: number;
    pointY: number;
    reachedMax: boolean;
  }>;
};

export type WorkerMessage = RayCastTask | { type: 'ping' };
export type WorkerResponse = RayCastResult | { type: 'pong' };

// DDA (Digital Differential Analysis) ray casting algorithm
// Same logic as castVisionRayDistance in hunterVision.ts
function castRay(
  grid: Uint8Array,
  width: number,
  height: number,
  originX: number,
  originY: number,
  angle: number,
  maxDistance: number
): { distance: number; pointX: number; pointY: number; reachedMax: boolean } {
  if (maxDistance <= 0) return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };

  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const EPSILON = 1e-9;

  const originCellX = Math.floor(originX);
  const originCellY = Math.floor(originY);
  
  // Bounds check for origin
  if (originCellX < 0 || originCellX >= width || originCellY < 0 || originCellY >= height) {
    return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };
  }
  
  // Check if origin is in a wall
  if (grid[originCellY * width + originCellX] === 1) {
    return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };
  }

  const invAbsDirX = Math.abs(dirX) > EPSILON ? 1 / Math.abs(dirX) : Number.POSITIVE_INFINITY;
  const invAbsDirY = Math.abs(dirY) > EPSILON ? 1 / Math.abs(dirY) : Number.POSITIVE_INFINITY;
  const stepX = dirX >= 0 ? 1 : -1;
  const stepY = dirY >= 0 ? 1 : -1;

  let cellX = originCellX;
  let cellY = originCellY;
  let tMaxX = Number.POSITIVE_INFINITY;
  let tMaxY = Number.POSITIVE_INFINITY;

  if (invAbsDirX < Number.POSITIVE_INFINITY) {
    const nextBoundaryX = stepX > 0 ? cellX + 1 : cellX;
    tMaxX = (nextBoundaryX - originX) / dirX;
  }
  if (invAbsDirY < Number.POSITIVE_INFINITY) {
    const nextBoundaryY = stepY > 0 ? cellY + 1 : cellY;
    tMaxY = (nextBoundaryY - originY) / dirY;
  }

  let finalDistance = maxDistance;
  let hitWall = false;

  while (true) {
    const advanceX = tMaxX <= tMaxY;
    const nextDistance = advanceX ? tMaxX : tMaxY;
    
    if (nextDistance > maxDistance) {
      finalDistance = maxDistance;
      break;
    }

    if (advanceX) {
      cellX += stepX;
      tMaxX += invAbsDirX;
    } else {
      cellY += stepY;
      tMaxY += invAbsDirY;
    }

    if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) {
      finalDistance = nextDistance;
      break;
    }
    
    if (grid[cellY * width + cellX] === 1) {
      finalDistance = nextDistance;
      hitWall = true;
      break;
    }
  }

  return {
    distance: finalDistance,
    pointX: originX + Math.cos(angle) * finalDistance,
    pointY: originY + Math.sin(angle) * finalDistance,
    reachedMax: !hitWall && finalDistance >= maxDistance - 1e-6,
  };
}

// Handle messages from main thread
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
  const data = e.data;

  if (data.type === 'ping') {
    self.postMessage({ type: 'pong' } as WorkerResponse);
    return;
  }

  if (data.type === 'castRays') {
    const {
      grid,
      gridWidth,
      gridHeight,
      originX,
      originY,
      startAngle,
      endAngle,
      maxDistance,
      rayCount,
      id,
    } = data;

    const rays: RayCastResult['rays'] = [];
    const angleStep = (endAngle - startAngle) / Math.max(1, rayCount - 1);

    for (let i = 0; i < rayCount; i++) {
      const angle = startAngle + i * angleStep;
      const result = castRay(grid, gridWidth, gridHeight, originX, originY, angle, maxDistance);
      rays.push({
        angle,
        distance: result.distance,
        pointX: result.pointX,
        pointY: result.pointY,
        reachedMax: result.reachedMax,
      });
    }

    self.postMessage({
      type: 'rayResults',
      id,
      rays,
    } as WorkerResponse);
  }
};

// Export for TypeScript module detection
export {};
