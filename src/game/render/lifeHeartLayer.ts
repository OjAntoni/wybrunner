import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { isWithinBounds, parseCellKey } from "./collectibleShared";
import type { VisibleTileBounds } from "./sceneTypes";

function drawHeartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const top = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(cx, cy + top);
  ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + top);
  ctx.bezierCurveTo(cx - size, cy + size * 1.25, cx, cy + size * 1.5, cx, cy + size * 1.8);
  ctx.bezierCurveTo(cx, cy + size * 1.5, cx + size, cy + size * 1.25, cx + size, cy + top);
  ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + top);
  ctx.closePath();
}

export function drawLifeHearts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (const key of state.lifeHearts) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const cx = x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const cy = y * TILE_SIZE + TILE_SIZE / 2 - camY;
    const pulse = 0.5 + 0.5 * Math.sin(now / 220 + (x * 0.5 + y * 0.35));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 88, 106, ${0.12 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + pulse * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawHeartShape(ctx, cx, cy - 1.8, 2.5);
    ctx.fillStyle = "rgba(250, 60, 85, 0.95)";
    ctx.fill();
  }
}
