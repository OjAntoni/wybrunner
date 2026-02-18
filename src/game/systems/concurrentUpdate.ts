// Concurrent game system updates using microtasks and requestIdleCallback
// This allows independent systems to be scheduled more efficiently

// Task priority levels
export enum TaskPriority {
  CRITICAL = 0,    // Must run immediately (player movement, collision)
  HIGH = 1,        // Should run every frame (projectiles, damage)
  NORMAL = 2,      // Can be staggered (items, timers)
  LOW = 3,         // Can be deferred (sensors, ambient effects)
}

// Task definition
type SystemTask = {
  name: string;
  priority: TaskPriority;
  execute: () => boolean | void;
  everyNthFrame?: number; // Run every N frames (staggering)
  frameOffset?: number;   // Offset for staggering
};

// Frame counter for staggering
let frameCounter = 0;

// System task registry
const systemTasks: SystemTask[] = [];

// Register a system task
export function registerSystemTask(
  name: string,
  priority: TaskPriority,
  execute: () => boolean | void,
  options?: { everyNthFrame?: number; frameOffset?: number }
): void {
  systemTasks.push({
    name,
    priority,
    execute,
    everyNthFrame: options?.everyNthFrame,
    frameOffset: options?.frameOffset,
  });
  
  // Sort by priority
  systemTasks.sort((a, b) => a.priority - b.priority);
}

// Execute all tasks for the current frame
export function executeFrameTasks(): boolean {
  frameCounter++;
  
  let shouldContinue = true;
  
  for (const task of systemTasks) {
    // Check if task should run this frame (staggering)
    if (task.everyNthFrame && task.everyNthFrame > 1) {
      const offset = task.frameOffset || 0;
      if ((frameCounter + offset) % task.everyNthFrame !== 0) {
        continue;
      }
    }
    
    // Execute task
    const result = task.execute();
    
    // If task returns false, signal to stop processing
    if (result === false) {
      shouldContinue = false;
      break;
    }
  }
  
  return shouldContinue;
}

// Schedule low-priority tasks during idle time
let idleCallbackId: number | null = null;

export function scheduleIdleTasks(tasks: Array<() => void>): void {
  if (typeof requestIdleCallback === 'undefined') {
    // Fallback: use setTimeout with 0
    tasks.forEach((task) => setTimeout(task, 0));
    return;
  }
  
  if (idleCallbackId !== null) {
    cancelIdleCallback(idleCallbackId);
  }
  
  let taskIndex = 0;
  
  const processTasks = (deadline: IdleDeadline) => {
    while (taskIndex < tasks.length && deadline.timeRemaining() > 0) {
      tasks[taskIndex]();
      taskIndex++;
    }
    
    if (taskIndex < tasks.length) {
      idleCallbackId = requestIdleCallback(processTasks);
    } else {
      idleCallbackId = null;
    }
  };
  
  idleCallbackId = requestIdleCallback(processTasks);
}

// Parallel processing for independent entities
// Uses microtasks to yield control between batches
export async function processEntitiesInBatches<T>(
  entities: T[],
  processFn: (entity: T) => void,
  batchSize: number = 10
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    const processBatch = () => {
      const endIndex = Math.min(index + batchSize, entities.length);
      
      for (; index < endIndex; index++) {
        processFn(entities[index]);
      }
      
      if (index < entities.length) {
        // Schedule next batch as microtask to allow rendering
        queueMicrotask(processBatch);
      } else {
        resolve();
      }
    };
    
    processBatch();
  });
}

// Clear all registered tasks (for testing)
export function clearSystemTasks(): void {
  systemTasks.length = 0;
  frameCounter = 0;
  if (idleCallbackId !== null) {
    cancelIdleCallback(idleCallbackId);
    idleCallbackId = null;
  }
}

// Get current frame number
export function getFrameCounter(): number {
  return frameCounter;
}

// Reset frame counter
export function resetFrameCounter(): void {
  frameCounter = 0;
}
