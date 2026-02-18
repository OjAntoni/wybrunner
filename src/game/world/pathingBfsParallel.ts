// Parallel BFS pathfinding for multiple entities
// Uses Web Workers to distribute pathfinding computation

import type { Cell, Vec } from '../model/types';

export type BfsTask = {
  type: 'bfs';
  grid: Uint8Array;
  width: number;
  height: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  id: number;
};

export type BfsResult = {
  type: 'bfsResult';
  id: number;
  direction: { x: number; y: number };
  found: boolean;
};

// BFS Worker implementation
export function createBfsWorkerCode(): string {
  return `
    // BFS Pathfinding Worker
    self.onmessage = function(e) {
      const data = e.data;
      
      if (data.type === 'bfs') {
        const { grid, width, height, startX, startY, targetX, targetY, id } = data;
        
        const startIdx = startY * width + startX;
        const targetIdx = targetY * width + targetX;
        
        // Use arrays for queue and parent tracking
        const parent = new Int32Array(width * height);
        parent.fill(-1);
        
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;
        
        parent[startIdx] = startIdx;
        queue[tail++] = startIdx;
        
        const cardinalDirs = [
          { x: 1, y: 0 }, { x: -1, y: 0 },
          { x: 0, y: 1 }, { x: 0, y: -1 }
        ];
        
        let found = false;
        
        while (head < tail) {
          const currentIdx = queue[head++];
          if (currentIdx === targetIdx) {
            found = true;
            break;
          }
          
          const currentX = currentIdx % width;
          const currentY = (currentIdx / width) | 0;
          
          for (const dir of cardinalDirs) {
            const nx = currentX + dir.x;
            const ny = currentY + dir.y;
            
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (grid[ny * width + nx] === 1) continue;
            
            const nextIdx = ny * width + nx;
            if (parent[nextIdx] !== -1) continue;
            
            parent[nextIdx] = currentIdx;
            queue[tail++] = nextIdx;
          }
        }
        
        let resultDir = { x: 0, y: 0 };
        
        if (found && targetIdx !== startIdx) {
          // Backtrack to find first step
          let stepIdx = targetIdx;
          while (parent[stepIdx] !== startIdx && parent[stepIdx] !== -1) {
            stepIdx = parent[stepIdx];
          }
          
          if (stepIdx !== targetIdx && parent[stepIdx] === startIdx) {
            const stepX = stepIdx % width;
            const stepY = (stepIdx / width) | 0;
            resultDir = { x: stepX - startX, y: stepY - startY };
          }
        }
        
        self.postMessage({
          type: 'bfsResult',
          id,
          direction: resultDir,
          found
        });
      }
    };
  `;
}

// Batch BFS requests for parallel processing
export async function batchBfsPathfinding(
  requests: Array<{
    grid: Cell[][];
    start: Vec;
    target: Vec;
    id: number;
  }>,
  useWorkers: boolean = false
): Promise<Map<number, { direction: Vec; found: boolean }>> {
  if (!useWorkers || requests.length < 2 || typeof Worker === 'undefined') {
    // Fall back to synchronous processing
    const results = new Map<number, { direction: Vec; found: boolean }>();
    
    for (const req of requests) {
      // Import and use the main thread BFS
      const { bfsNextStep } = await import('./pathingBfs');
      const direction = bfsNextStep(req.grid, req.start, req.target);
      results.set(req.id, {
        direction,
        found: direction.x !== 0 || direction.y !== 0
      });
    }
    
    return results;
  }
  
  // Parallel processing with workers would go here
  // For now, just use synchronous version
  return batchBfsPathfinding(requests, false);
}

// Flatten grid for worker transfer
export function flattenGridForBfs(grid: Cell[][]): Uint8Array {
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
