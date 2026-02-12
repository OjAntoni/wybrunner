import { FOG_AREA_FADE_MS } from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { packCell } from "../utils/grid";
import { clamp01 } from "../utils/math";
import { ensureFogSprites, type SpriteCacheRef } from "./cloudSprites";

export function drawFogAreas(
  ctx: CanvasRenderingContext2D,
  nowMs: number,
  state: GameState,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  playerCell: Vec,
  spriteRef: SpriteCacheRef
) {
  if (state.fogAreas.length === 0) return;

  ensureFogSprites(spriteRef);
  const sprites = spriteRef.current;
  if (!sprites || sprites.length === 0) return;

  const viewLeft = camX;
  const viewTop = camY;
  const viewRight = camX + viewW;
  const viewBottom = camY + viewH;
  const t = nowMs / 1000;
  const playerPacked = packCell(playerCell.x, playerCell.y);
  for (const area of state.fogAreas) {
    const fadeIn = clamp01((nowMs - area.start) / FOG_AREA_FADE_MS);
    const fadeOut = clamp01((area.end - nowMs) / FOG_AREA_FADE_MS);
    const fade = Math.min(fadeIn, fadeOut);
    if (fade <= 0) continue;
    const eased = fade * fade * (3 - 2 * fade);

    if (
      area.bounds.maxX < viewLeft ||
      area.bounds.maxY < viewTop ||
      area.bounds.minX > viewRight ||
      area.bounds.minY > viewBottom
    ) {
      continue;
    }

    const insideLerp = state.fogAreaInside.get(area.id) ?? (area.cellSet.has(playerPacked) ? 1 : 0);
    const insideBoost = 1 + 0.1 * insideLerp;
    const intensity = eased * insideBoost;

    ctx.save();
    // Clip path is stored in world px coords; translate to view for clipping.
    ctx.translate(-camX, -camY);
    ctx.clip(area.clipPath);
    ctx.translate(camX, camY);

    for (const cloud of area.clouds) {
      const ox = Math.sin(t * cloud.fx + cloud.phaseX) * cloud.amp;
      const oy = Math.cos(t * cloud.fy + cloud.phaseY) * cloud.amp;
      const x = cloud.x - camX + ox;
      const y = cloud.y - camY + oy;
      const half = cloud.size * 0.5;

      if (x + half < 0 || y + half < 0 || x - half > viewW || y - half > viewH) continue;

      ctx.globalAlpha = clamp01(cloud.alpha * intensity);
      const sprite = sprites[cloud.shade] ?? sprites[0];
      ctx.drawImage(sprite, x - half, y - half, cloud.size, cloud.size);
    }

    ctx.restore();
  }
}
