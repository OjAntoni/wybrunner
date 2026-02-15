import { TILE_SIZE } from "../config/constants";
import type { Vec } from "../model/types";
import { getDayNightSnapshot } from "../systems/dayNight";
import { drawExploreClouds, drawFogAreas } from "./cloudLayers";
import { drawNightLightingOverlay, drawNightWarningText } from "./dayNightLayer";
import { drawFog } from "./fogOverlay";
import { drawGuidanceArrows } from "./guidance";
import { drawHunterVisions } from "./hunterVisionLayer";
import {
  drawEnemySenseIndicator,
  drawGhostPathsOverlay,
  drawGhosts,
  drawHelpers,
  drawHunters,
  drawMonsters,
  drawPlayer,
  drawPlayerPopup,
  drawTurrets,
} from "./sceneActors";
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
  drawTerrainTiles(ctx, state, camX, camY, bounds, viewW, viewH);
  drawArrowThrowers(ctx, state, now, camX, camY, bounds);

  const playerScreenX = state.player.x * TILE_SIZE - camX;
  const playerScreenY = state.player.y * TILE_SIZE - camY;
  const playerCell: Vec = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  const dayNightSnapshot = getDayNightSnapshot(state, now);
  const cloudNightBlend = dayNightSnapshot.darknessAlpha;

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
    fogSpritesRef,
    cloudNightBlend
  );
  drawExploreClouds(
    ctx,
    now,
    state,
    camX,
    camY,
    viewW,
    viewH,
    exploreCloudSpritesRef,
    cloudNightBlend
  );

  drawHunterVisions(ctx, state, now, camX, camY);
  drawHelpers(ctx, state, now, camX, camY);
  drawHunters(ctx, state, now, camX, camY);
  drawTurrets(ctx, state, now, camX, camY);
  drawPlayer(ctx, state, now, camX, camY);
  drawEnemySenseIndicator(ctx, state, camX, camY);
  drawMonsters(ctx, state, now, camX, camY);

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
  const overlaySnapshot = drawNightLightingOverlay(ctx, state, now, camX, camY, viewW, viewH);
  drawGhostPathsOverlay(ctx, state, now, camX, camY);
  drawGhosts(ctx, state, now, camX, camY);
  drawPlayerPopup(ctx, state, now, camX, camY, touchEnabled);
  drawNightWarningText(ctx, overlaySnapshot, viewW, viewH);
}
