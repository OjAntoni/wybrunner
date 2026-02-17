// INP Optimization: Deferred state updates to prevent blocking the main thread
// During input handling, we update refs immediately for responsiveness,
// but defer React state updates to the next event loop tick

type DeferredTask = () => void;

let deferredQueue: DeferredTask[] = [];
let isScheduled = false;

function flushDeferred() {
  const tasks = deferredQueue;
  deferredQueue = [];
  isScheduled = false;
  
  for (const task of tasks) {
    try {
      task();
    } catch (e) {
      console.error("Error in deferred task:", e);
    }
  }
}

function scheduleFlush() {
  if (isScheduled) return;
  isScheduled = true;
  
  // Use setTimeout(0) to yield to browser for paint
  // This ensures INP stays low by allowing immediate paint after input
  setTimeout(flushDeferred, 0);
}

/**
 * Defers a state update to prevent blocking input handling.
 * Use this for non-critical UI state updates during input handling.
 */
export function deferStateUpdate(task: DeferredTask): void {
  deferredQueue.push(task);
  scheduleFlush();
}

/**
 * Defers multiple state updates as a batch.
 * More efficient than calling deferStateUpdate multiple times.
 */
export function deferBatchUpdate(tasks: DeferredTask[]): void {
  deferredQueue.push(...tasks);
  scheduleFlush();
}

/**
 * Updates a ref immediately and defers the corresponding React state update.
 * This pattern provides immediate responsiveness while keeping INP low.
 * 
 * Example:
 *   // In input handler
 *   updateDeferred(pausedRef, setPaused, true);
 *   // ref is updated immediately, React state update is deferred
 */
export function updateDeferred<T>(
  ref: React.MutableRefObject<T>,
  setState: (value: T) => void,
  value: T
): void {
  ref.current = value;
  deferStateUpdate(() => setState(value));
}

/**
 * Immediately flushes all deferred updates.
 * Use sparingly - only when you need state to be synchronized immediately.
 */
export function flushDeferredUpdates(): void {
  if (deferredQueue.length > 0) {
    flushDeferred();
  }
}
