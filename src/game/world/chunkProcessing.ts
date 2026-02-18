import {
  CHUNK_SIZE,
  CHUNKS_X,
  CHUNKS_Y,
} from "../render/terrainChunks";

// Configuration for chunk-based processing
export const CHUNK_UPDATE_DISTANCE_CHUNKS = 3; // Update chunks within this many chunks of visible area
export const CHUNK_UPDATE_MAX_DISTANCE_TILES = CHUNK_SIZE * CHUNK_UPDATE_DISTANCE_CHUNKS;

export type ChunkCoord = { cx: number; cy: number };

/**
 * Calculate chunk coordinates from tile coordinates
 */
export function getChunkFromTile(x: number, y: number): ChunkCoord {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
  };
}

/**
 * Get the key for a chunk coordinate (for Map/Set usage)
 */
export function getChunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

// ---- Optimized chunk active mask (Uint8Array instead of Set<string>) ----

const TOTAL_CHUNKS = CHUNKS_X * CHUNKS_Y;

/** Flat bitmask: 1 = active, 0 = inactive. Index = cy * CHUNKS_X + cx. */
let chunkActiveMask = new Uint8Array(TOTAL_CHUNKS);

function chunkIndex(cx: number, cy: number): number {
  return cy * CHUNKS_X + cx;
}

/**
 * Check if a chunk is within the active update zone
 */
export function isChunkActive(
  cx: number,
  cy: number,
  // Legacy signature kept for compatibility — parameter is ignored
  _activeChunks?: unknown
): boolean {
  if (cx < 0 || cx >= CHUNKS_X || cy < 0 || cy >= CHUNKS_Y) return false;
  return chunkActiveMask[chunkIndex(cx, cy)] === 1;
}

/**
 * Calculate active chunks based on camera position and viewport.
 * Returns a Set<string> for backwards compatibility with code that may
 * still reference it, but the fast path uses the Uint8Array mask.
 */
export function calculateActiveChunks(
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): Set<string> {
  const activeChunks = new Set<string>();

  // Calculate visible chunk range with margin
  const marginPx = CHUNK_UPDATE_DISTANCE_CHUNKS * CHUNK_SIZE * 12; // TILE_SIZE = 12

  const startChunkX = Math.floor((camX - marginPx) / (CHUNK_SIZE * 12));
  const startChunkY = Math.floor((camY - marginPx) / (CHUNK_SIZE * 12));
  const endChunkX = Math.ceil((camX + viewW + marginPx) / (CHUNK_SIZE * 12));
  const endChunkY = Math.ceil((camY + viewH + marginPx) / (CHUNK_SIZE * 12));

  // Clamp to valid chunk range
  const clampedStartX = Math.max(0, startChunkX);
  const clampedStartY = Math.max(0, startChunkY);
  const clampedEndX = Math.min(CHUNKS_X, endChunkX);
  const clampedEndY = Math.min(CHUNKS_Y, endChunkY);

  // Add all chunks in range to active set
  for (let cy = clampedStartY; cy < clampedEndY; cy++) {
    for (let cx = clampedStartX; cx < clampedEndX; cx++) {
      activeChunks.add(getChunkKey(cx, cy));
    }
  }

  return activeChunks;
}

/**
 * Check if an entity at a given position should be updated
 * based on active chunks. Uses fast Uint8Array lookup.
 */
export function shouldUpdateEntity(
  posX: number,
  posY: number,
  // Legacy parameter kept for API compatibility — ignored
  _activeChunks?: unknown
): boolean {
  const cx = Math.floor(Math.floor(posX) / CHUNK_SIZE);
  const cy = Math.floor(Math.floor(posY) / CHUNK_SIZE);
  if (cx < 0 || cx >= CHUNKS_X || cy < 0 || cy >= CHUNKS_Y) return false;
  return chunkActiveMask[cy * CHUNKS_X + cx] === 1;
}

/**
 * Get statistics about active chunks for debugging
 */
export function getActiveChunkStats(activeChunks: Set<string>): {
  active: number;
  total: number;
  percentage: number;
} {
  const total = CHUNKS_X * CHUNKS_Y;
  const active = activeChunks.size;
  return {
    active,
    total,
    percentage: Math.round((active / total) * 100),
  };
}

/**
 * Store active chunks for use by update systems.
 * Populates both the Uint8Array mask (fast) and legacy Set<string>.
 */
export function updateActiveChunks(
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): void {
  // Clear mask
  chunkActiveMask.fill(0);

  const marginPx = CHUNK_UPDATE_DISTANCE_CHUNKS * CHUNK_SIZE * 12;
  const clampedStartX = Math.max(0, Math.floor((camX - marginPx) / (CHUNK_SIZE * 12)));
  const clampedStartY = Math.max(0, Math.floor((camY - marginPx) / (CHUNK_SIZE * 12)));
  const clampedEndX = Math.min(CHUNKS_X, Math.ceil((camX + viewW + marginPx) / (CHUNK_SIZE * 12)));
  const clampedEndY = Math.min(CHUNKS_Y, Math.ceil((camY + viewH + marginPx) / (CHUNK_SIZE * 12)));

  for (let cy = clampedStartY; cy < clampedEndY; cy++) {
    for (let cx = clampedStartX; cx < clampedEndX; cx++) {
      chunkActiveMask[cy * CHUNKS_X + cx] = 1;
    }
  }

  // Also keep the legacy Set for any code that still uses it.
  globalActiveChunks = calculateActiveChunks(camX, camY, viewW, viewH);
}

// Module-level storage for active chunks (avoids modifying GameState type)
let globalActiveChunks: Set<string> = new Set();

/**
 * Get the current active chunks
 */
export function getGlobalActiveChunks(): Set<string> {
  return globalActiveChunks;
}

/**
 * Clear active chunks (call on game reset)
 */
export function clearActiveChunks(): void {
  globalActiveChunks = new Set();
  chunkActiveMask.fill(0);
}

/**
 * Calculate distance from entity to nearest active chunk edge
 * Useful for determining if entity is approaching active zone
 */
export function distanceToActiveZone(
  posX: number,
  posY: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): number {
  const entityChunk = getChunkFromTile(Math.floor(posX), Math.floor(posY));

  // Calculate visible chunk bounds
  const marginPx = CHUNK_UPDATE_DISTANCE_CHUNKS * CHUNK_SIZE * 12;
  const visibleStartX = Math.floor((camX - marginPx) / (CHUNK_SIZE * 12));
  const visibleStartY = Math.floor((camY - marginPx) / (CHUNK_SIZE * 12));
  const visibleEndX = Math.ceil((camX + viewW + marginPx) / (CHUNK_SIZE * 12));
  const visibleEndY = Math.ceil((camY + viewH + marginPx) / (CHUNK_SIZE * 12));

  // If inside active zone, distance is 0
  if (
    entityChunk.cx >= visibleStartX &&
    entityChunk.cx < visibleEndX &&
    entityChunk.cy >= visibleStartY &&
    entityChunk.cy < visibleEndY
  ) {
    return 0;
  }

  // Calculate distance to nearest edge
  const dx = Math.max(
    visibleStartX - entityChunk.cx - 1,
    0,
    entityChunk.cx - visibleEndX
  );
  const dy = Math.max(
    visibleStartY - entityChunk.cy - 1,
    0,
    entityChunk.cy - visibleEndY
  );

  return Math.sqrt(dx * dx + dy * dy) * CHUNK_SIZE;
}
