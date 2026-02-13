import { EXPLORE_CLOUD_FADE_MS, EXPLORE_CLOUD_OPACITY_MULT } from "../config/constants";
import type { GameState } from "../model/types";
import { clamp01 } from "../utils/math";
import { visitExploreCloudCandidates } from "../world/exploration";
import {
  ensureExploreCloudNightSprites,
  ensureExploreCloudSprites,
  type SpriteCacheRef,
} from "./cloudSprites";

export function drawExploreClouds(
  ctx: CanvasRenderingContext2D,
  nowMs: number,
  state: GameState,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  spriteRef: SpriteCacheRef,
  nightBlend: number = 0
) {
  if (state.exploreClouds.length === 0) return;
  const safeNightBlend = clamp01(nightBlend);
  const dayMul = 1 - safeNightBlend;
  const nightMul = safeNightBlend;

  let daySprites: HTMLCanvasElement[] | null = null;
  let nightSprites: HTMLCanvasElement[] | null = null;
  if (dayMul > 0) {
    ensureExploreCloudSprites(spriteRef);
    daySprites = spriteRef.current;
  }
  if (nightMul > 0) {
    nightSprites = ensureExploreCloudNightSprites();
  }
  if (dayMul > 0 && (!daySprites || daySprites.length === 0)) return;
  if (nightMul > 0 && (!nightSprites || nightSprites.length === 0)) return;

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

    const baseAlpha = clamp01(cloud.alpha * fadeMul * EXPLORE_CLOUD_OPACITY_MULT);
    if (dayMul > 0 && daySprites) {
      ctx.globalAlpha = clamp01(baseAlpha * dayMul);
      const daySprite = daySprites[cloud.shade] ?? daySprites[0];
      ctx.drawImage(daySprite, x - half, y - half, cloud.size, cloud.size);
    }
    if (nightMul > 0 && nightSprites) {
      ctx.globalAlpha = clamp01(baseAlpha * nightMul);
      const nightSprite = nightSprites[cloud.shade] ?? nightSprites[0];
      ctx.drawImage(nightSprite, x - half, y - half, cloud.size, cloud.size);
    }
  });
  ctx.restore();
}
