import { GRID_H, GRID_W, TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";

// Chunk configuration
export const CHUNK_SIZE = 16; // 16x16 tiles per chunk
export const CHUNK_SIZE_PX = CHUNK_SIZE * TILE_SIZE;

// Calculate number of chunks
export const CHUNKS_X = Math.ceil(GRID_W / CHUNK_SIZE);
export const CHUNKS_Y = Math.ceil(GRID_H / CHUNK_SIZE);

export type ChunkCoord = { cx: number; cy: number };
export type ChunkCache = Map<string, HTMLCanvasElement>;

// Chunk cache
let chunkCache: ChunkCache = new Map();
let chunkGridRef: GameState["grid"] | null = null;

function getChunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

function getTerrainRevision(state: GameState): number {
  const count = state.explosions.length;
  if (count === 0) return 0;
  return state.explosions[count - 1].start;
}

// Get visible chunk coordinates
export function getVisibleChunks(
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  paddingChunks: number = 1
): ChunkCoord[] {
  const startChunkX = Math.floor((camX - paddingChunks * CHUNK_SIZE_PX) / CHUNK_SIZE_PX);
  const startChunkY = Math.floor((camY - paddingChunks * CHUNK_SIZE_PX) / CHUNK_SIZE_PX);
  const endChunkX = Math.ceil((camX + viewW + paddingChunks * CHUNK_SIZE_PX) / CHUNK_SIZE_PX);
  const endChunkY = Math.ceil((camY + viewH + paddingChunks * CHUNK_SIZE_PX) / CHUNK_SIZE_PX);
  
  const chunks: ChunkCoord[] = [];
  
  for (let cy = Math.max(0, startChunkY); cy < Math.min(CHUNKS_Y, endChunkY); cy++) {
    for (let cx = Math.max(0, startChunkX); cx < Math.min(CHUNKS_X, endChunkX); cx++) {
      chunks.push({ cx, cy });
    }
  }
  
  return chunks;
}

// Render a single chunk
function renderChunk(
  grid: GameState["grid"],
  cx: number,
  cy: number,
  ownerDocument: Document
): HTMLCanvasElement {
  const canvas = ownerDocument.createElement("canvas");
  canvas.width = CHUNK_SIZE_PX;
  canvas.height = CHUNK_SIZE_PX;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  
  ctx.imageSmoothingEnabled = false;
  
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const endX = Math.min(startX + CHUNK_SIZE, GRID_W);
  const endY = Math.min(startY + CHUNK_SIZE, GRID_H);
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      ctx.fillStyle = grid[y][x] === 1 ? "#1f1f2b" : "#0f3b2e";
      ctx.fillRect(
        (x - startX) * TILE_SIZE,
        (y - startY) * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
  
  return canvas;
}

// Track which revision we've cleared the cache for
let lastClearedRevision = -1;

// Get or create chunk canvas
export function getChunk(
  state: GameState,
  cx: number,
  cy: number,
  ownerDocument: Document
): HTMLCanvasElement | null {
  const key = getChunkKey(cx, cy);
  const currentRevision = getTerrainRevision(state);
  const gridChanged = chunkGridRef !== state.grid;
  
  // Clear cache if grid changed or if there's a new explosion we haven't processed
  if (gridChanged || (currentRevision > 0 && currentRevision !== lastClearedRevision)) {
    chunkCache.clear();
    chunkGridRef = state.grid;
    lastClearedRevision = currentRevision;
  }
  
  let chunk = chunkCache.get(key);
  if (!chunk) {
    chunk = renderChunk(state.grid, cx, cy, ownerDocument);
    chunkCache.set(key, chunk);
  }
  
  return chunk;
}

// Clear chunk cache (call when game resets)
export function clearChunkCache(): void {
  chunkCache.clear();
  chunkGridRef = null;
  lastClearedRevision = -1;
}

// Get chunk cache stats for debugging
export function getChunkCacheStats(): { size: number; capacity: number } {
  return {
    size: chunkCache.size,
    capacity: CHUNKS_X * CHUNKS_Y,
  };
}
