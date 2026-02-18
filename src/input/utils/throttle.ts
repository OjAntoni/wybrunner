// Input throttling utilities to prevent action spam and reduce INP
// These utilities block rapid-fire inputs that don't provide gameplay value

export type ThrottledFunction<T extends (...args: any[]) => void> = T & {
  reset(): void;
};

/**
 * Creates a throttled function that only executes once per specified interval.
 * Subsequent calls within the interval are ignored.
 * 
 * Use for: Equipment placement, action buttons that shouldn't be spammed
 * 
 * @param fn The function to throttle
 * @param intervalMs Minimum time between executions (ms)
 * @returns Throttled function with a reset() method
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  intervalMs: number
): ThrottledFunction<T> {
  let lastTime = 0;
  let rafId: number | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= intervalMs) {
      // Execute immediately if enough time has passed
      lastTime = now;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingArgs = null;
      fn(...args);
    } else if (rafId === null) {
      // Schedule execution at the end of the interval
      pendingArgs = args;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingArgs !== null) {
          lastTime = performance.now();
          fn(...pendingArgs);
          pendingArgs = null;
        }
      });
    }
    // If RAF is already scheduled, drop this call (no queue buildup)
  };

  throttled.reset = () => {
    lastTime = 0;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingArgs = null;
  };

  return throttled as ThrottledFunction<T>;
}

/**
 * Creates a leading-edge throttled function that executes immediately
 * but then blocks subsequent calls for the interval.
 * 
 * Use for: Actions where immediate feedback is important (sword swing)
 * 
 * @param fn The function to throttle
 * @param intervalMs Minimum time between executions (ms)
 * @returns Throttled function with a reset() method
 */
export function throttleLeading<T extends (...args: any[]) => void>(
  fn: T,
  intervalMs: number
): ThrottledFunction<T> {
  let lastTime = 0;
  let rafId: number | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= intervalMs) {
      // Execute immediately
      lastTime = now;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        pendingArgs = null;
      }
      fn(...args);
    } else if (rafId === null) {
      // Schedule trailing execution
      pendingArgs = args;
      const remaining = intervalMs - elapsed;
      // Use setTimeout for precise timing, RAF for frame alignment
      rafId = requestAnimationFrame(() => {
        const timeoutId = window.setTimeout(() => {
          rafId = null;
          if (pendingArgs !== null) {
            lastTime = performance.now();
            fn(...pendingArgs);
            pendingArgs = null;
          }
        }, remaining);
        // Store timeout ID in a way that allows cleanup
        (throttled as any)._timeoutId = timeoutId;
      });
    }
  };

  throttled.reset = () => {
    lastTime = 0;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if ((throttled as any)._timeoutId) {
      clearTimeout((throttled as any)._timeoutId);
    }
    pendingArgs = null;
  };

  return throttled as ThrottledFunction<T>;
}

/**
 * Creates a debounced function that delays execution until after
 * the specified interval of inactivity.
 * 
 * Use for: Map zoom/pan operations, search inputs
 * 
 * @param fn The function to debounce
 * @param waitMs Time to wait after last call before executing (ms)
 * @returns Debounced function with a cancel() method
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  waitMs: number
): T & { cancel(): void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel(): void };
}

/**
 * Input rate limiter using a token bucket algorithm.
 * Allows bursts up to maxTokens, then enforces interval between calls.
 * 
 * Use for: Rapid-fire actions where some burst is acceptable
 * 
 * @param fn The function to rate limit
 * @param maxTokens Maximum number of rapid calls allowed
 * @param refillIntervalMs Time to refill one token (ms)
 * @returns Rate limited function
 */
export function rateLimit<T extends (...args: any[]) => void>(
  fn: T,
  maxTokens: number,
  refillIntervalMs: number
): (...args: Parameters<T>) => void {
  let tokens = maxTokens;
  let lastRefill = performance.now();

  return (...args: Parameters<T>) => {
    const now = performance.now();
    const elapsed = now - lastRefill;
    const tokensToAdd = Math.floor(elapsed / refillIntervalMs);

    if (tokensToAdd > 0) {
      tokens = Math.min(maxTokens, tokens + tokensToAdd);
      lastRefill = now;
    }

    if (tokens > 0) {
      tokens--;
      fn(...args);
    }
  };
}
