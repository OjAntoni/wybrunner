# Webrunner Game Performance Optimization Plan

## Executive Summary

Based on comprehensive analysis of the codebase, the game suffers from **severe memory allocation pressure** in hot paths, **redundant calculations every frame**, and **inefficient algorithms** that cause the "slow motion" feeling. This plan addresses these issues systematically across 6 phases.

**Key Issues Identified:**
- BFS pathfinding allocates 48KB+ per call (Critical)
- Vision ray casting creates thousands of temporary objects per frame (Critical)
- Hunter AI recalculates paths every frame (Critical)
- Ghost path generation causes 100-500ms freezes on night transition (Critical)
- Constant object creation causes frequent GC pauses (High)

---

## Phase 1: Critical Path Optimizations (Week 1)

### 1.1 BFS Pathfinding Array Pooling ✅ COMPLETED
**Problem**: `bfsNextStepHunter` allocates 48KB+ per call (two Int32Arrays)
**Files**: `src/game/world/pathingBfs.ts`
**Impact**: Critical - causes GC pauses during chase
**Status**: ✅ Implemented 2026-02-17

**Implementation**:
- Created `BfsBufferPool` class to manage reusable Int32Arrays
- Pre-allocate buffers once, reuse across all BFS calls
- Reset parent array with `fill(-1, 0, totalCells)` only up to needed size
- Reduced allocations from ~48KB per call to 0KB after first call
- **Estimated improvement**: 5-15ms/frame reduction, ~100% elimination of BFS allocations

### 1.2 Vision Ray Casting Optimization ⚠️ REVERTED
**Problem**: Creates thousands of temporary objects per frame (rays, points)
**Files**: `src/game/world/hunterVision.ts`, `src/game/render/hunterVisionLayer.ts`
**Impact**: Critical - 3-10ms/frame overhead
**Status**: ⚠️ Reverted 2026-02-17 - Implementation broke vision rendering

**Note**: Initial implementation attempted to optimize vision ray casting with buffer pooling, but introduced bugs in the vision cone rendering. Reverted to original implementation. The optimization approach was:
- Created `VisionRayPool` class with Float64Array buffers for angle, distance, point coordinates
- Pre-allocate all ray calculation buffers at module initialization
- Added `sampleVisionConeToBuffers()` function for zero-allocation ray casting
- **Issues**: Vision cones not rendering correctly after changes

**Next Steps**: Need to re-implement more carefully, ensuring visual output matches original exactly before applying optimization.

### 1.3 Hunter Path Caching
**Problem**: BFS called every frame for every chasing hunter
**Files**: `src/game/systems/update/hunter.ts`
**Impact**: Critical - O(n) pathfinding per hunter per frame

**Implementation**:
- Cache last known path for each hunter
- Recalculate path only every 5-10 frames or when target moves significantly
- Use incremental path updates
- Invalidate cache on wall changes (bombs)
- **Estimated improvement**: 5-12ms/frame reduction

---

## Phase 2: Memory Pressure Reduction (Week 2)

### 2.1 Object Pooling System
**Problem**: Constant object creation (positions, vectors, Sets, Maps)
**Files**: Multiple files across the codebase
**Impact**: High - causes frequent GC pauses

**Implementation**:
- Create generic object pool for Vec2 objects
- Pool for temporary arrays and Sets
- Pool for hunter decision-making objects
- **Estimated improvement**: 2-5ms/frame reduction

### 2.2 In-Place Position Updates
**Problem**: Object spread creates new position objects every frame
**Files**: `src/game/systems/update/hunter.ts`, `src/game/systems/update/monster.ts`
**Impact**: High - GC pressure with many entities

**Implementation**:
- Replace `hunter.pos = { ...hunter.target }` with direct property updates
- Update `hunter.pos.x` and `hunter.pos.y` in-place
- Same for all entity position updates
- **Estimated improvement**: 1-3ms/frame reduction

### 2.3 Data Structure Reuse
**Problem**: New Maps and Sets created every frame in enemy sense calculation
**Files**: `src/game/systems/update/enemySense.ts`
**Impact**: High - unnecessary GC pressure

**Implementation**:
- Pre-allocate Maps and Sets at initialization
- Use `clear()` method instead of creating new instances
- Reuse candidate arrays in hunter AI
- **Estimated improvement**: 1-2ms/frame reduction

---

## Phase 3: Algorithmic Improvements (Week 3)

### 3.1 Spatial Indexing for Entity Queries
**Problem**: O(n²) distance checks between player and enemies
**Files**: `src/game/systems/update/hunter.ts`, `src/game/systems/update/monster.ts`
**Impact**: High - scales poorly with enemy count

**Implementation**:
- Implement grid-based spatial hash
- Only check entities in nearby cells
- Use for vision checks, collision detection, and proximity queries
- **Estimated improvement**: 2-5ms/frame reduction with many enemies

### 3.2 Ghost Path Generation Optimization
**Problem**: 220 attempts with heavy computation on night transition
**Files**: `src/game/systems/update/monster.ts`
**Impact**: Critical - causes frame freeze (100-500ms spike)

**Implementation**:
- Pre-generate ghost paths during day phase
- Use web workers for path generation
- Or spread generation across multiple frames
- Simplify path smoothing algorithm
- **Estimated improvement**: Eliminates night transition freeze

### 3.3 Cache Key Optimization
**Problem**: String concatenation for cache keys every frame
**Files**: `src/game/render/hunterVisionLayer.ts`
**Impact**: Medium - string allocation overhead

**Implementation**:
- Use numeric composite keys instead of strings
- Or pre-compute and cache key patterns
- **Estimated improvement**: 0.5-1ms/frame reduction

---

## Phase 4: Rendering Optimizations (Week 4)

### 4.1 Canvas State Minimization
**Problem**: Excessive `ctx.save()`/`ctx.restore()` calls
**Files**: `src/game/render/scene.ts` and all render layers
**Impact**: Medium - canvas state changes are expensive

**Implementation**:
- Minimize save/restore calls by grouping operations
- Use offscreen canvases for static layers
- Batch similar drawing operations
- **Estimated improvement**: 1-2ms/frame reduction

### 4.2 Layered Canvas Architecture
**Problem**: Redrawing everything every frame
**Files**: All render files
**Impact**: High - unnecessary redraws

**Implementation**:
- Separate static terrain to cached canvas (already partially done)
- Cache vision cones that don't change frequently
- Only redraw dynamic entities each frame
- Use dirty rectangle tracking
- **Estimated improvement**: 3-6ms/frame reduction

### 4.3 Fog Area Animation Optimization
**Problem**: Trigonometric functions for every cloud every frame
**Files**: `src/game/render/fogAreaLayer.ts`
**Impact**: Medium - CPU intensive

**Implementation**:
- Use pre-computed sine/cosine lookup tables
- Or reduce animation complexity
- **Estimated improvement**: 0.5-1ms/frame reduction

---

## Phase 5: System Architecture Improvements (Week 5)

### 5.1 Update System Throttling
**Problem**: All systems update every frame regardless of necessity
**Files**: `src/game/systems/updateState.ts`
**Impact**: Medium - unnecessary work

**Implementation**:
- Implement priority-based update scheduling
- Throttle non-critical systems (e.g., patrol AI) to every 2-3 frames
- Use delta time accumulation for consistent behavior
- **Estimated improvement**: 1-3ms/frame reduction

### 5.2 Web Workers for Heavy Computation
**Problem**: Pathfinding blocks main thread
**Files**: `src/game/world/pathingBfs.ts`
**Impact**: High - causes frame drops

**Implementation**:
- Move BFS pathfinding to web workers
- Async path calculation with callbacks
- Maintain responsive UI during path computation
- **Estimated improvement**: Eliminates pathfinding stutter

### 5.3 Component-Based Entity System
**Problem**: Monolithic update functions process all entities
**Files**: `src/game/systems/update/hunter.ts`, `src/game/systems/update/monster.ts`
**Impact**: Medium - hard to optimize selectively

**Implementation**:
- Refactor to component-based architecture
- Enable selective updates based on entity state
- Better cache locality
- **Estimated improvement**: 1-2ms/frame reduction

---

## Phase 6: Monitoring and Polish (Week 6)

### 6.1 Performance Profiling Infrastructure
**Implementation**:
- Add detailed performance markers
- Track memory allocation rates
- Monitor GC frequency
- Create performance regression tests

### 6.2 Dynamic Quality Scaling
**Implementation**:
- Detect frame rate drops automatically
- Reduce visual quality when performance degrades
- Scale down effects, reduce enemy count, simplify rendering
- Restore quality when performance improves

### 6.3 Memory Leak Detection
**Implementation**:
- Audit all event listeners and subscriptions
- Ensure proper cleanup on game reset
- Monitor heap growth over time

---

## Quick Wins (Can be implemented immediately)

1. **Reduce BFS allocation** - Use pre-allocated arrays (1-2 hours)
2. **Cache squared distances** - Avoid redundant calculations (30 minutes)
3. **Reuse Sets in enemy sense** - Clear instead of recreate (30 minutes)
4. **Throttle hunter path recalculation** - Only recalculate every N frames (1 hour)
5. **Reduce vision ray count** - Already reduced to 64, could go lower for distant entities (30 minutes)

---

## Expected Performance Improvements

| Phase | Expected FPS Improvement | Memory Pressure Reduction |
|-------|-------------------------|---------------------------|
| Phase 1 | +10-20 FPS | -40% allocations |
| Phase 2 | +5-10 FPS | -30% allocations |
| Phase 3 | +5-15 FPS | -10% allocations |
| Phase 4 | +5-10 FPS | Minimal |
| Phase 5 | +5-10 FPS | -20% allocations |
| Phase 6 | Monitoring only | - |

**Total Expected Improvement**: 30-65 FPS increase, 60-70% reduction in memory allocations

---

## Implementation Priority

1. **Immediate (Day 1)**: BFS pooling, vision ray optimization, path caching
2. **Week 1**: Object pooling, in-place updates, data structure reuse
3. **Week 2**: Spatial indexing, ghost path pre-generation
4. **Week 3**: Canvas optimization, layered rendering
5. **Week 4**: Update throttling, web workers
6. **Week 5**: Monitoring and dynamic scaling

---

## Testing Strategy

1. **Performance Benchmarks**: Measure frame times before/after each phase
2. **Memory Profiling**: Track heap size and GC frequency
3. **Gameplay Testing**: Ensure optimizations don't break game logic
4. **Device Testing**: Test on low-end devices to verify improvements

---

## Detailed Issue Analysis

### Critical Issues

#### 1. BFS Pathfinding - Int32Array Allocation Per Call
**File**: `src/game/systems/update/hunter.ts` (lines 693-695), `src/game/world/pathingBfs.ts` (lines 25-27)

```typescript
const parent = new Int32Array(totalCells);
parent.fill(-1);
const queue = new Int32Array(totalCells);
```

**Problem**: Allocates two Int32Array objects on every call. With a 96x64 grid (6,144 cells), this allocates ~48KB per call. Hunters call this multiple times per frame during chase mode.

**Impact**: Severe GC pressure during gameplay with multiple hunters chasing.

---

#### 2. Array/Object Creation in Hot Path - `chooseNervousSearchTargetCell`
**File**: `src/game/systems/update/hunter.ts` (lines 145-219)

Creates new arrays, Sets, and objects every time a hunter searches. Called frequently during nervous scan mode.

**Impact**: High GC pressure, especially with multiple hunters.

---

#### 3. Vision Cone Ray Casting - 48-64 Rays Per Entity Per Frame
**Files**: 
- `src/game/world/hunterVision.ts` (lines 86-115)
- `src/game/render/hunterVisionLayer.ts` (lines 104-111)
- `src/game/render/dayNightLayer.ts` (lines 234-241)

For 20-30 hunters + turrets, this creates thousands of temporary objects per frame.

**Impact**: Severe GC pressure, potential frame drops to <30fps.

---

#### 4. Ghost Path Generation - Heavy Computation on Night Transition
**File**: `src/game/systems/update/monster.ts` (lines 509-579)

Spawning ghosts runs 220 attempts with path generation, Gaussian smoothing, and validation. Happens on every night transition.

**Impact**: Frame freeze when night begins (hundreds of milliseconds).

---

### High Severity Issues

#### 5. Object Spread in Position Updates
**File**: `src/game/systems/update/hunter.ts` (lines 979, 986-989)

```typescript
hunter.pos = { ...hunter.target };  // NEW OBJECT
hunter.pos = {
  x: hunter.pos.x + (toTarget.x / dist) * hunterSpeed,
  y: hunter.pos.y + (toTarget.y / dist) * hunterSpeed,
};
```

Object spread creates new position objects every frame for every moving hunter.

---

#### 6. Redundant Distance Calculations
**File**: `src/game/systems/update/hunter.ts` (multiple locations)

Distance calculated multiple times per hunter per frame in different code paths.

**Impact**: Redundant square root calculations.

---

#### 7. Canvas State Changes in Drawing Functions
**File**: `src/game/render/scene.ts` (entire file)

Multiple `ctx.save()` and `ctx.restore()` calls across nested drawing functions.

**Impact**: Canvas state changes are expensive; excessive calls slow rendering.

---

## References

- **GAME_LOGIC.md**: Game mechanics and component structure
- **ARCHITECTURE.md**: Module layering and refactor boundaries
- **Performance profiling**: Enable with `window.__GAME_PERF__ = true` in browser console
- **Detailed spike logging**: Enable with `window.__GAME_PERF_VERBOSE__ = true`

---

## Notes

- All DOM updates already bypass React (optimized in previous work)
- Canvas DPR is already capped at 1.5 to reduce GPU load
- HUD counters update via direct DOM manipulation (no React overhead)
- Simulation delta is already clamped at 24ms to prevent large jumps

Last Updated: 2026-02-17
