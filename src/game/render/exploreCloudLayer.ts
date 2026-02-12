import { EXPLORE_CLOUD_FADE_MS, EXPLORE_CLOUD_OPACITY_MULT } from "../config/constants";
import type { GameState } from "../model/types";
import { clamp01 } from "../utils/math";
import { visitExploreCloudCandidates } from "../world/exploration";
import { ensureExploreCloudSprites, type SpriteCacheRef } from "./cloudSprites";

export function drawExploreClouds(
  ctx: CanvasRenderingContext2D,
  nowMs: number,
  state: GameState,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  spriteRef: SpriteCacheRef
) {
  if (state.exploreClouds.length === 0) return;
  ensureExploreCloudSprites(spriteRef);
  const sprites = spriteRef.current;
  if (!sprites || sprites.length === 0) return;

  ctx.save();
  const viewMinX = camX;
  const viewMinY = camY;
  const viewMaxX = camX + viewW;
  const viewMaxY = camY + viewH;
  visitExploreCloudCandidates(state, viewMinX, viewMinY, viewMaxX, viewMaxY, (cloud) => {
    const fadeT =
      cloud.fadeStart === null
        ? 0
        : clamp01((nowMs - cloud.fadeStart) / EXPLORE_CLOUD_FADE_MS);
    const fadeMul = 1 - fadeT;
    if (fadeMul <= 0) return;

    const half = cloud.half;
    const x = cloud.x - camX;
    const y = cloud.y - camY;
    if (x + half < 0 || y + half < 0 || x - half > viewW || y - half > viewH) return;

    ctx.globalAlpha = clamp01(cloud.alpha * fadeMul * EXPLORE_CLOUD_OPACITY_MULT);
    const sprite = sprites[cloud.shade] ?? sprites[0];
    ctx.drawImage(sprite, x - half, y - half, cloud.size, cloud.size);
  });
  ctx.restore();
}
