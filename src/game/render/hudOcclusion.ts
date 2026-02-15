import {
  CAMERA_ZOOM,
  DESKTOP_CAMERA_ZOOM_MULT,
  GRID_H,
  GRID_W,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getCamera } from "./camera";

export type HudRectsCache = {
  hudTop: DOMRect | null;
  inventory: DOMRect | null;
  lastUpdate: number;
};

type UpdateHudOcclusionParams = {
  now: number;
  state: GameState;
  hudTopEl: HTMLDivElement | null;
  inventoryEl: HTMLElement | null;
  cache: HudRectsCache;
  dpr: number;
  canvasWidth: number;
  canvasHeight: number;
  touchEnabled: boolean;
};

export function updateHudOcclusion({
  now,
  state,
  hudTopEl,
  inventoryEl,
  cache,
  dpr,
  canvasWidth,
  canvasHeight,
  touchEnabled,
}: UpdateHudOcclusionParams) {
  if (!hudTopEl || !inventoryEl) return;

  if (now - cache.lastUpdate > 250) {
    cache.hudTop = hudTopEl.getBoundingClientRect();
    cache.inventory = inventoryEl.getBoundingClientRect();
    cache.lastUpdate = now;
  }
  if (!cache.hudTop || !cache.inventory) return;

  const cameraZoom = CAMERA_ZOOM * (touchEnabled ? 1 : DESKTOP_CAMERA_ZOOM_MULT);
  const cssW = canvasWidth / dpr;
  const cssH = canvasHeight / dpr;
  const viewW = cssW / cameraZoom;
  const viewH = cssH / cameraZoom;
  const worldW = GRID_W * TILE_SIZE;
  const worldH = GRID_H * TILE_SIZE;
  const cam = getCamera(state.player, viewW, viewH, worldW, worldH);

  const playerViewX = state.player.x * TILE_SIZE - cam.x;
  const playerViewY = state.player.y * TILE_SIZE - cam.y;
  const playerCssX = playerViewX * cameraZoom;
  const playerCssY = playerViewY * cameraZoom;

  const pad = 100;
  const underHud =
    playerCssX >= cache.hudTop.left - pad &&
    playerCssX <= cache.hudTop.right + pad &&
    playerCssY >= cache.hudTop.top - pad &&
    playerCssY <= cache.hudTop.bottom + pad;
  const underInv =
    playerCssX >= cache.inventory.left - pad &&
    playerCssX <= cache.inventory.right + pad &&
    playerCssY >= cache.inventory.top - pad &&
    playerCssY <= cache.inventory.bottom + pad;

  hudTopEl.classList.toggle("occluded", underHud);
  inventoryEl.classList.toggle("occluded", underInv);
}
