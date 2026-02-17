import type { Cell, Vec } from "../model/types";
import { CARDINAL_DIRS } from "./pathingDirections";
import { bestNeighborStep } from "./pathingSteering";

// Buffer pool for BFS to avoid repeated allocations
// For a 96x64 grid, each buffer is ~24KB, so two buffers = ~48KB per BFS call
class BfsBufferPool {
  private parentBuffer: Int32Array | null = null;
  private queueBuffer: Int32Array | null = null;
  private capacity = 0;

  getBuffers(requiredSize: number): { parent: Int32Array; queue: Int32Array } {
    // Only reallocate if we need more capacity
    if (this.capacity < requiredSize || this.parentBuffer === null || this.queueBuffer === null) {
      this.capacity = requiredSize;
      this.parentBuffer = new Int32Array(requiredSize);
      this.queueBuffer = new Int32Array(requiredSize);
    }
    return { parent: this.parentBuffer, queue: this.queueBuffer };
  }
}

// Global pool instance - shared across all BFS calls
const globalBfsPool = new BfsBufferPool();

export function bfsNextStep(grid: Cell[][], start: Vec, target: Vec): Vec {
  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;
  if (width <= 0 || height <= 0) {
    return bestNeighborStep(grid, start, target);
  }
  if (
    start.x < 0 ||
    start.y < 0 ||
    target.x < 0 ||
    target.y < 0 ||
    start.x >= width ||
    target.x >= width ||
    start.y >= height ||
    target.y >= height
  ) {
    return bestNeighborStep(grid, start, target);
  }

  const totalCells = width * height;
  
  // Use pooled buffers instead of allocating new arrays
  const { parent, queue } = globalBfsPool.getBuffers(totalCells);
  
  // Reset parent array - only up to the cells we need
  parent.fill(-1, 0, totalCells);
  
  let head = 0;
  let tail = 0;

  const startIdx = start.y * width + start.x;
  const targetIdx = target.y * width + target.x;

  parent[startIdx] = startIdx;
  queue[tail] = startIdx;
  tail += 1;

  while (head < tail) {
    const currentIdx = queue[head];
    head += 1;
    if (currentIdx === targetIdx) break;

    const currentX = currentIdx % width;
    const currentY = (currentIdx / width) | 0;

    for (const direction of CARDINAL_DIRS) {
      const nx = currentX + direction.x;
      const ny = currentY + direction.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (grid[ny][nx] === 1) continue;
      const nextIdx = ny * width + nx;
      if (parent[nextIdx] !== -1) continue;
      parent[nextIdx] = currentIdx;
      queue[tail] = nextIdx;
      tail += 1;
    }
  }

  if (parent[targetIdx] === -1) {
    return bestNeighborStep(grid, start, target);
  }

  let stepIdx = targetIdx;
  while (stepIdx !== startIdx && parent[stepIdx] !== startIdx) {
    stepIdx = parent[stepIdx];
    if (stepIdx < 0) {
      return bestNeighborStep(grid, start, target);
    }
  }

  const sx = stepIdx % width;
  const sy = (stepIdx / width) | 0;
  return { x: sx - start.x, y: sy - start.y };
}
