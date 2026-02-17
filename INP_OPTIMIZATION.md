# INP (Interaction to Next Paint) Optimization

## Problem

The game had an INP (Interaction to Next Paint) of **216ms**, which is too high for responsive gameplay. INP measures how long it takes from user interaction to the next visual update.

## Root Cause

React state updates were being executed **synchronously** during keyboard input handlers. When a key is pressed:

1. Keyboard event fires
2. Handler immediately calls React `setState()` functions
3. React processes state update and triggers reconciliation
4. Re-rendering blocks the main thread
5. Browser can't paint the visual feedback until React finishes

This created a significant delay between input and visual response.

## Solution

Implemented **deferred state updates** using `setTimeout(..., 0)` to yield to the browser's event loop:

### Architecture

```
User Input
    ↓
Update Refs (immediate - responsive)
    ↓
Queue State Updates (deferred)
    ↓
Yield to Browser (paint!)
    ↓
Process Deferred Updates (React re-render)
```

### Key Benefits

1. **Immediate Responsiveness**: Refs are updated synchronously, so game logic responds immediately
2. **Visual Feedback**: Browser can paint immediately after input handling (low INP)
3. **Non-blocking**: React state updates happen in a separate event loop tick
4. **Batched**: Multiple state updates are batched together to minimize re-renders

## Implementation

### New Utility: `src/game/utils/deferredState.ts`

Provides three functions:

- `deferStateUpdate(task)` - Queues a single state update
- `deferBatchUpdate(tasks)` - Queues multiple updates as a batch
- `updateDeferred(ref, setState, value)` - Updates ref immediately, defers state

### Modified Files

1. **Navigation Actions** (`createNavigationActions.ts`)
   - All UI state updates now use `deferStateUpdate()`
   - Refs updated immediately for game logic
   - React state updates deferred to next tick

2. **Session Actions** (`createSessionActions.ts`)
   - Game restart, pause/resume operations use deferred updates
   - DOM updates (non-React) still happen immediately
   - Multiple related state updates batched together

## Code Example

### Before (Blocking)
```typescript
const pauseGame = () => {
  keysRef.current.clear();
  resetTouchInput();
  pausedRef.current = true;
  setPaused(true); // ← Blocks main thread immediately
};
```

### After (Non-blocking)
```typescript
const pauseGame = () => {
  keysRef.current.clear();
  resetTouchInput();
  pausedRef.current = true; // ← Immediate for game logic
  deferStateUpdate(() => setPaused(true)); // ← Deferred, non-blocking
};
```

## Expected Impact

- **Before**: 216ms INP
- **After**: < 50ms INP (target for "Good" rating)
- **Improvement**: ~75% reduction in interaction latency

## When to Use Deferred Updates

**Use deferred updates for:**
- UI state changes (overlay visibility, menu state)
- Non-critical display updates
- Navigation between screens
- Settings/preference changes

**Keep synchronous for:**
- Game state mutations (player position, enemy AI)
- Physics updates
- Collision detection
- Immediate feedback that affects gameplay

## Testing

To verify INP improvements:

1. Open Chrome DevTools
2. Go to Performance panel
3. Enable "Web Vitals" overlay
4. Interact with the game using keyboard
5. Check INP values in real-time

Or use the console:
```javascript
// Check INP via Performance Observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.interactionId) {
      console.log('INP:', entry.duration, 'ms');
    }
  }
});
observer.observe({ entryTypes: ['event'] });
```

## Notes

- The game uses refs for immediate game state, React state for UI rendering
- This separation allows us to defer React updates without affecting gameplay
- `setTimeout(..., 0)` is used instead of `requestIdleCallback` for broader browser support
- Deferred updates are automatically batched if multiple are queued before flush
