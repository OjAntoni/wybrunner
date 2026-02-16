import {
  CAMERA_ZOOM,
  DESKTOP_CAMERA_ZOOM_MULT,
  GRID_H,
  GRID_W,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { updateSceneCamera } from "./camera";
import type { SceneViewport } from "./sceneTypes";

type PrepareSceneViewportParams = {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  now: number;
  dpr: number;
  touchEnabled: boolean;
};

export function prepareSceneViewport({
  ctx,
  state,
  now,
  dpr,
  touchEnabled,
}: PrepareSceneViewportParams): SceneViewport {
  const baseZoom = CAMERA_ZOOM * (touchEnabled ? 1 : DESKTOP_CAMERA_ZOOM_MULT);
  const cssW = ctx.canvas.width / dpr;
  const cssH = ctx.canvas.height / dpr;

  const worldW = GRID_W * TILE_SIZE;
  const worldH = GRID_H * TILE_SIZE;
  const camera = updateSceneCamera({
    state,
    now,
    cssW,
    cssH,
    baseZoom,
    worldW,
    worldH,
  });

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.setTransform(dpr * camera.zoom, 0, 0, dpr * camera.zoom, 0, 0);

  const viewW = camera.viewW;
  const viewH = camera.viewH;
  ctx.fillStyle = "#0a0c12";
  ctx.fillRect(0, 0, viewW, viewH);

  const camX = camera.x;
  const camY = camera.y;

  const bounds = {
    startX: Math.max(0, Math.floor(camX / TILE_SIZE) - 2),
    startY: Math.max(0, Math.floor(camY / TILE_SIZE) - 2),
    endX: Math.min(GRID_W - 1, Math.floor((camX + viewW) / TILE_SIZE) + 2),
    endY: Math.min(GRID_H - 1, Math.floor((camY + viewH) / TILE_SIZE) + 2),
  };

  return { camX, camY, viewW, viewH, heartbeatPulse: camera.heartbeatPulse, bounds };
}
