import type { GameState } from "../model/types";
import { drawBoosters, drawCoins, drawItems } from "./sceneCollectiblesLayer";
import { drawExplosions } from "./sceneEffectsLayer";
import {
  drawRevealedUndergroundTraps,
  drawSpikes,
  drawTraps,
} from "./sceneHazardsLayer";
import type { VisibleTileBounds } from "./sceneTypes";

export function drawWorldObjects(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  bounds: VisibleTileBounds
) {
  drawCoins(ctx, state, camX, camY, bounds);
  drawItems(ctx, state, now, camX, camY, viewW, viewH);
  drawBoosters(ctx, state, now, camX, camY, bounds);
  drawTraps(ctx, state, now, camX, camY, bounds);
  drawRevealedUndergroundTraps(ctx, state, now, camX, camY, bounds);
  drawExplosions(ctx, state, now, camX, camY);
  drawSpikes(ctx, state, now, camX, camY, bounds);
}
