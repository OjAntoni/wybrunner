import { TILE_SIZE } from "../config/constants";
import type { Vec } from "../model/types";
import { drawExploreClouds, drawFogAreas } from "./cloudLayers";
import { drawFog } from "./fogOverlay";
import { drawGuidanceArrows } from "./guidance";
import { drawHelpers, drawMonster, drawPlayer } from "./sceneActors";
import { drawWorldObjects } from "./sceneObjectLayer";
import { drawArrows } from "./sceneProjectileLayer";
import { drawArrowThrowers, drawTerrainTiles } from "./sceneTerrainLayer";
import type { DrawSceneParams } from "./sceneTypes";
import { prepareSceneViewport } from "./sceneViewport";

export function drawScene({
  ctx,
  state,
  now,
  dpr,
  touchEnabled,
  fogSpritesRef,
  exploreCloudSpritesRef,
}: DrawSceneParams) {
  const { camX, camY, viewW, viewH, bounds } = prepareSceneViewport({
    ctx,
    state,
    dpr,
    touchEnabled,
  });
  drawTerrainTiles(ctx, state, camX, camY, bounds);
  drawArrowThrowers(ctx, state, camX, camY, bounds);

  const playerScreenX = state.player.x * TILE_SIZE - camX;
  const playerScreenY = state.player.y * TILE_SIZE - camY;
  const playerCell: Vec = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };

  drawWorldObjects(ctx, state, now, camX, camY, viewW, viewH, bounds);
  drawArrows(ctx, state, camX, camY, viewW, viewH);

  // Draw cloud layers after arrows so unexplored areas hide projectiles too.
  drawFogAreas(
    ctx,
    now,
    state,
    camX,
    camY,
    viewW,
    viewH,
    playerCell,
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

  drawHelpers(ctx, state, now, camX, camY);
  drawPlayer(ctx, state, camX, camY);
  drawMonster(ctx, state, now, camX, camY);

  if (now < state.fogUntil) {
    drawFog(
      ctx,
      now,
      state.player.x * TILE_SIZE - camX,
      state.player.y * TILE_SIZE - camY,
      state.fogStart,
      state.fogUntil,
      viewW,
      viewH
    );
  }

  drawGuidanceArrows(
    ctx,
    state,
    now,
    camX,
    camY,
    viewW,
    viewH,
    playerScreenX,
    playerScreenY
  );
}
