// Parallel Processing Demo and Utilities
// Shows how to use Web Workers and concurrent processing in the game

import { getWorkerPool, terminateWorkerPool } from './workers/workerPool';
import {
  sampleVisionConeRaysParallel,
  setParallelEnabled,
  clearGridCache,
} from './world/hunterVisionParallel';
import { processEntitiesInBatches, scheduleIdleTasks } from './systems/concurrentUpdate';
import type { GameState } from './model/types';
import type { Cell } from './model/types';

// Initialize parallel processing
export async function initializeParallelProcessing(): Promise<void> {
  try {
    const pool = await getWorkerPool();
    const stats = pool.getStats();
    console.log(`[Parallel] Initialized with ${stats.poolSize} workers`);
    setParallelEnabled(true);
  } catch (err) {
    console.warn('[Parallel] Failed to initialize workers:', err);
    setParallelEnabled(false);
  }
}

// Clean up parallel processing
export function cleanupParallelProcessing(): void {
  terminateWorkerPool();
  clearGridCache();
}

// Example: Process hunters in batches to avoid frame drops
export async function updateHuntersInBatches(
  _state: GameState,
  batchSize: number = 5
): Promise<void> {
  await processEntitiesInBatches(
    [],
    () => {
      // Update individual hunter logic here
      // This yields control every batchSize hunters
    },
    batchSize
  );
}

// Example: Schedule non-critical updates during idle time
export function scheduleAmbientUpdates(_state: GameState): void {
  const tasks: Array<() => void> = [
    () => {
      // Update distant cloud animations
    },
    () => {
      // Update off-screen hunter animations
    },
    () => {
      // Update background particles
    },
  ];
  
  scheduleIdleTasks(tasks);
}

// Example: Parallel vision cone calculation for multiple enemies
export async function calculateVisionConesParallel(
  grid: Cell[][],
  hunters: Array<{ pos: { x: number; y: number }; facing: number }>
): Promise<Array<{ rays: Array<{ angle: number; distance: number; pointX: number; pointY: number }> }>> {
  const promises = hunters.map((hunter) =>
    sampleVisionConeRaysParallel(
      grid,
      hunter.pos,
      { x: Math.cos(hunter.facing), y: Math.sin(hunter.facing) },
      10, // radius
      60, // angle
      24  // ray count
    ).then((rays) => ({
      rays: rays.map((r) => ({
        angle: r.angle,
        distance: r.distance,
        pointX: r.point.x,
        pointY: r.point.y,
      })),
    }))
  );
  
  return Promise.all(promises);
}

// Toggle parallel processing at runtime
export function toggleParallelProcessing(enabled: boolean): void {
  setParallelEnabled(enabled);
  console.log(`[Parallel] Processing ${enabled ? 'enabled' : 'disabled'}`);
}

// Check if parallel processing is available
export function isParallelProcessingAvailable(): boolean {
  return typeof Worker !== 'undefined' && navigator.hardwareConcurrency > 1;
}

// Get parallel processing stats
export async function getParallelStats(): Promise<{
  workersAvailable: boolean;
  workerCount: number;
  activeTasks: number;
  queuedTasks: number;
}> {
  if (!isParallelProcessingAvailable()) {
    return {
      workersAvailable: false,
      workerCount: 0,
      activeTasks: 0,
      queuedTasks: 0,
    };
  }
  
  try {
    const pool = await getWorkerPool();
    const stats = pool.getStats();
    return {
      workersAvailable: true,
      workerCount: stats.poolSize,
      activeTasks: stats.activeTasks,
      queuedTasks: stats.queuedTasks,
    };
  } catch {
    return {
      workersAvailable: false,
      workerCount: 0,
      activeTasks: 0,
      queuedTasks: 0,
    };
  }
}
