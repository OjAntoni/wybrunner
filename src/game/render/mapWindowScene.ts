import { GRID_H, GRID_W, TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { clamp } from "../utils/math";
import { drawExploreClouds, drawFogAreas } from "./cloudLayers";
import type { SpriteCacheRef } from "./cloudSprites";
import { drawHunterVisions } from "./hunterVisionLayer";
import { drawHelpers, drawHunters, drawMonster, drawPlayer } from "./sceneActors";
import { drawWorldObjects } from "./sceneObjectLayer";
import { drawArrows } from "./sceneProjectileLayer";
import { drawArrowThrowers, drawTerrainTiles } from "./sceneTerrainLayer";
import type { VisibleTileBounds } from "./sceneTypes";

export type MapCenter = { x: number; y: number };

export const MAP_WORLD_W = GRID_W * TILE_SIZE;
export const MAP_WORLD_H = GRID_H * TILE_SIZE;

type DrawMapWindowSceneParams = {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  now: number;
  dpr: number;
  zoom: number;
  center: MapCenter;
  fogSpritesRef: SpriteCacheRef;
  exploreCloudSpritesRef: SpriteCacheRef;
};

type DrawMapWindowSceneResult = {
  center: MapCenter;
};

function getVisibleBounds(
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): VisibleTileBounds {
  return {
    startX: Math.max(0, Math.floor(camX / TILE_SIZE) - 2),
    startY: Math.max(0, Math.floor(camY / TILE_SIZE) - 2),
    endX: Math.min(GRID_W - 1, Math.floor((camX + viewW) / TILE_SIZE) + 2),
    endY: Math.min(GRID_H - 1, Math.floor((camY + viewH) / TILE_SIZE) + 2),
  };
}

export function clampMapCenter(center: MapCenter, viewW: number, viewH: number): MapCenter {
  const x =
    MAP_WORLD_W <= viewW ? MAP_WORLD_W * 0.5 : clamp(center.x, viewW * 0.5, MAP_WORLD_W - viewW * 0.5);
  const y =
    MAP_WORLD_H <= viewH ? MAP_WORLD_H * 0.5 : clamp(center.y, viewH * 0.5, MAP_WORLD_H - viewH * 0.5);
  return { x, y };
}

export function drawMapWindowScene({
  ctx,
  state,
  now,
  dpr,
  zoom,
  center,
  fogSpritesRef,
  exploreCloudSpritesRef,
}: DrawMapWindowSceneParams): DrawMapWindowSceneResult {
  const cssW = ctx.canvas.width / dpr;
  const cssH = ctx.canvas.height / dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#040710";
  ctx.fillRect(0, 0, cssW, cssH);

  if (cssW <= 0 || cssH <= 0 || zoom <= 0) {
    return { center };
  }

  const viewW = cssW / zoom;
  const viewH = cssH / zoom;
  const clampedCenter = clampMapCenter(center, viewW, viewH);
  const camX = clampedCenter.x - viewW * 0.5;
  const camY = clampedCenter.y - viewH * 0.5;
  const bounds = getVisibleBounds(camX, camY, viewW, viewH);

  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
  ctx.fillStyle = "#08121a";
  ctx.fillRect(0, 0, viewW, viewH);

  drawTerrainTiles(ctx, state, camX, camY, bounds);
  drawArrowThrowers(ctx, state, camX, camY, bounds);
  drawWorldObjects(ctx, state, now, camX, camY, viewW, viewH, bounds);
  drawArrows(ctx, state, camX, camY, viewW, viewH);

  drawFogAreas(
    ctx,
    now,
    state,
    camX,
    camY,
    viewW,
    viewH,
    {
      x: Math.floor(state.player.x),
      y: Math.floor(state.player.y),
    },
    fogSpritesRef
  );
  drawExploreClouds(
    ctx,
    now,
    state,
    camX,
    camY,
    viewW,
    viewH,
    exploreCloudSpritesRef
  );

  drawHunterVisions(ctx, state, now, camX, camY);
  drawHelpers(ctx, state, now, camX, camY);
  drawHunters(ctx, state, now, camX, camY);
  drawMonster(ctx, state, now, camX, camY);
  drawPlayer(ctx, state, camX, camY);

  return { center: clampedCenter };
}
