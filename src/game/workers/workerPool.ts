// Worker Pool Manager for parallel computations
// Manages a pool of Web Workers for vision ray casting and other tasks

import type { RayCastTask, RayCastResult, WorkerResponse } from './visionWorker';

export type WorkerTask = {
  id: number;
  task: RayCastTask;
  resolve: (result: RayCastResult['rays']) => void;
  reject: (error: Error) => void;
};

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<number, WorkerTask>();
  private nextTaskId = 0;
  private isInitialized = false;
  private workerUrl: string | null = null;

  constructor(private poolSize: number = Math.max(1, navigator.hardwareConcurrency - 1 || 2)) {
    // Leave one core for main thread
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Check if workers are supported
    if (typeof Worker === 'undefined') {
      console.warn('[WorkerPool] Web Workers not supported, falling back to main thread');
      this.isInitialized = true;
      return;
    }

    try {
      // Create workers using inline blob URL
      // This avoids separate file loading issues
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);

      for (let i = 0; i < this.poolSize; i++) {
        const worker = new Worker(this.workerUrl);
        worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handleMessage(e.data);
        worker.onerror = (err) => this.handleError(err);
        this.workers.push(worker);
      }

      // Ping workers to verify they're alive
      await Promise.all(
        this.workers.map((worker, i) =>
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Worker ${i} did not respond to ping`));
            }, 5000);

            const checkPong = (e: MessageEvent) => {
              if (e.data?.type === 'pong') {
                clearTimeout(timeout);
                worker.removeEventListener('message', checkPong);
                resolve();
              }
            };

            worker.addEventListener('message', checkPong);
            worker.postMessage({ type: 'ping' });
          })
        )
      );

      this.isInitialized = true;
      console.log(`[WorkerPool] Initialized with ${this.poolSize} workers`);
    } catch (err) {
      console.error('[WorkerPool] Failed to initialize workers:', err);
      this.terminate();
      this.isInitialized = true; // Mark as initialized to use fallback
    }
  }

  private getWorkerCode(): string {
    // Return the worker code as a string
    // In production, this would be loaded from a separate file
    // For now, we reference the worker logic inline
    return `
      // DDA Ray Casting Worker
      function castRay(grid, width, height, originX, originY, angle, maxDistance) {
        if (maxDistance <= 0) return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };

        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const EPSILON = 1e-9;

        const originCellX = Math.floor(originX);
        const originCellY = Math.floor(originY);
        
        if (originCellX < 0 || originCellX >= width || originCellY < 0 || originCellY >= height) {
          return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };
        }
        
        if (grid[originCellY * width + originCellX] === 1) {
          return { distance: 0, pointX: originX, pointY: originY, reachedMax: true };
        }

        const invAbsDirX = Math.abs(dirX) > EPSILON ? 1 / Math.abs(dirX) : Infinity;
        const invAbsDirY = Math.abs(dirY) > EPSILON ? 1 / Math.abs(dirY) : Infinity;
        const stepX = dirX >= 0 ? 1 : -1;
        const stepY = dirY >= 0 ? 1 : -1;

        let cellX = originCellX;
        let cellY = originCellY;
        let tMaxX = Infinity;
        let tMaxY = Infinity;

        if (invAbsDirX < Infinity) {
          const nextBoundaryX = stepX > 0 ? cellX + 1 : cellX;
          tMaxX = (nextBoundaryX - originX) / dirX;
        }
        if (invAbsDirY < Infinity) {
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

      self.onmessage = function(e) {
        const data = e.data;

        if (data.type === 'ping') {
          self.postMessage({ type: 'pong' });
          return;
        }

        if (data.type === 'castRays') {
          const { grid, gridWidth, gridHeight, originX, originY, startAngle, endAngle, maxDistance, rayCount, id } = data;
          
          const rays = [];
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

          self.postMessage({ type: 'rayResults', id, rays });
        }
      };
    `;
  }

  private handleMessage(data: WorkerResponse): void {
    if (data.type === 'rayResults') {
      const task = this.activeTasks.get(data.id);
      if (task) {
        this.activeTasks.delete(data.id);
        task.resolve(data.rays);
        this.processQueue();
      }
    }
  }

  private handleError(error: ErrorEvent): void {
    console.error('[WorkerPool] Worker error:', error);
    // Reject all active tasks
    this.activeTasks.forEach((task) => {
      task.reject(new Error('Worker error: ' + error.message));
    });
    this.activeTasks.clear();
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.workers.length === 0) return;

    // Find available worker
    const availableWorkerIndex = this.workers.findIndex((_, i) => {
      // Simple round-robin - check if this worker isn't processing an active task
      const activeTaskCount = Array.from(this.activeTasks.values()).filter(
        (_, idx) => idx % this.workers.length === i
      ).length;
      return activeTaskCount < 2; // Allow up to 2 tasks per worker
    });

    if (availableWorkerIndex === -1) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    this.activeTasks.set(task.id, task);
    this.workers[availableWorkerIndex].postMessage(task.task, [task.task.grid.buffer]);
  }

  async castVisionCone(
    grid: Uint8Array,
    gridWidth: number,
    gridHeight: number,
    originX: number,
    originY: number,
    facingAngle: number,
    coneAngleDeg: number,
    maxDistance: number,
    rayCount: number
  ): Promise<RayCastResult['rays']> {
    // If workers not available, return null to signal fallback
    if (!this.isInitialized || this.workers.length === 0) {
      return Promise.reject(new Error('Workers not available'));
    }

    const halfConeAngle = (coneAngleDeg * Math.PI) / 360;
    const startAngle = facingAngle - halfConeAngle;
    const endAngle = facingAngle + halfConeAngle;

    const task: RayCastTask = {
      type: 'castRays',
      grid,
      gridWidth,
      gridHeight,
      originX,
      originY,
      startAngle,
      endAngle,
      maxDistance,
      rayCount,
      id: this.nextTaskId++,
    };

    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        id: task.id,
        task,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }
    this.activeTasks.clear();
    this.taskQueue = [];
    this.isInitialized = false;
  }

  getStats(): { poolSize: number; activeTasks: number; queuedTasks: number } {
    return {
      poolSize: this.workers.length,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
    };
  }
}

// Singleton instance
let workerPool: WorkerPool | null = null;

export async function getWorkerPool(): Promise<WorkerPool> {
  if (!workerPool) {
    workerPool = new WorkerPool();
    await workerPool.initialize();
  }
  return workerPool;
}

export function terminateWorkerPool(): void {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
}
