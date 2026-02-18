import type { GameState } from "../model/types";
import { drawBoosters, drawCoins, drawItems, drawLifeHearts } from "./sceneCollectiblesLayer";
import { drawCoinPickupBursts, drawExplosions } from "./sceneEffectsLayer";
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
  bounds: VisibleTileBounds,
  renderSmallDetails: boolean = true
) {
  if (renderSmallDetails) {
    drawCoins(ctx, state, camX, camY, bounds);
  }
  drawCoinPickupBursts(ctx, state, now, camX, camY, viewW, viewH);
  drawLifeHearts(ctx, state, now, camX, camY, bounds);
  drawItems(ctx, state, now, camX, camY, viewW, viewH);
  drawBoosters(ctx, state, now, camX, camY, bounds);
  drawTraps(ctx, state, now, camX, camY, bounds);
  drawRevealedUndergroundTraps(ctx, state, now, camX, camY, bounds);
  drawExplosions(ctx, state, now, camX, camY, viewW, viewH);
  drawSpikes(ctx, state, now, camX, camY, bounds);
}
