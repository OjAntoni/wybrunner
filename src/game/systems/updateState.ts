import {
  CAMERA_ZOOM,
  DESKTOP_CAMERA_ZOOM_MULT,
  GRID_H,
  GRID_W,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getCamera } from "../render/camera";
import {
  updateActiveChunks,
} from "../world/chunkProcessing";
import { updateHelpers } from "./helpers";
import { updateEnemySenseIndicator } from "./update/enemySense";
import { updateHunters } from "./update/hunter";
import { updateItems } from "./update/items";
import { updateMonster } from "./update/monster";
import { updatePlayerProgress } from "./update/playerProgress";
import { updateProjectiles } from "./update/projectiles";
import { updateSwordHits } from "./update/sword";
import { updateTimedSystems } from "./update/timers";
import { updateTurrets } from "./update/turret";
import type { UpdateGameStateDeps } from "./update/types";

export type { UpdateGameStateDeps } from "./update/types";

// Store last known canvas dimensions for viewport calculation
let lastCanvasWidth = 1024;
let lastCanvasHeight = 768;

/**
 * Update the stored canvas dimensions - call this from the game loop
 * where canvas context is available
 */
export function updateCanvasDimensions(width: number, height: number): void {
  lastCanvasWidth = width;
  lastCanvasHeight = height;
}

// Calculate viewport dimensions based on player position
// This mirrors the logic in sceneViewport.ts and camera.ts
function calculateViewportForChunkUpdate(
  state: GameState,
  touchEnabled: boolean
): { camX: number; camY: number; viewW: number; viewH: number } {
  const baseZoom = CAMERA_ZOOM * (touchEnabled ? 1 : DESKTOP_CAMERA_ZOOM_MULT);
  // Use actual canvas dimensions for accurate chunk calculations
  const cssW = lastCanvasWidth;
  const cssH = lastCanvasHeight;

  const worldW = GRID_W * TILE_SIZE;
  const worldH = GRID_H * TILE_SIZE;

  const viewW = cssW / baseZoom;
  const viewH = cssH / baseZoom;

  // Camera follows player (same logic as camera.ts)
  const camera = getCamera(
    { x: state.player.x, y: state.player.y },
    viewW,
    viewH,
    worldW,
    worldH
  );

  return { camX: camera.x, camY: camera.y, viewW, viewH };
}

export function updateGameState(
  state: GameState,
  dt: number,
  now: number,
  deps: UpdateGameStateDeps
) {
  const playerProgress = updatePlayerProgress(state, dt, now, deps);
  if (!playerProgress.alive) return;

  // Calculate active chunks based on camera viewport
  // This enables chunk-based processing for entity updates
  const { camX, camY, viewW, viewH } = calculateViewportForChunkUpdate(
    state,
    deps.touchEnabled
  );
  updateActiveChunks(camX, camY, viewW, viewH);

  updateSwordHits(state, now);

  updateTurrets(state, dt, now);

  if (!updateProjectiles(state, dt, now)) return;

  updateItems(
    state,
    now,
    playerProgress.playerCell,
    playerProgress.playerKey
  );

  updateTimedSystems(state, dt, now, playerProgress.playerCell);

  if (!updateMonster(state, dt, now, deps.touchEnabled)) return;
  if (!updateHunters(state, dt, now)) return;
  updateEnemySenseIndicator(state, dt);

  if (state.status === "playing" && state.helpers.length > 0) {
    updateHelpers(state, dt, now);
  }
}
