import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { isWithinBounds, parseCellKey } from "./collectibleShared";
import type { VisibleTileBounds } from "./sceneTypes";

export function drawBoosters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (const key of state.boosters) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const bob = Math.sin(now / 220 + (x + y) * 0.3) * 1.2;
    const px = x * TILE_SIZE - camX;
    const py = y * TILE_SIZE - camY + bob;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(80, 255, 140, 0.35)";
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#22d36a";
    ctx.fillRect(px + 3, py + 4, 4, 5);
    ctx.fillRect(px + 2, py + 7, 6, 2);
    ctx.fillStyle = "#b7ffd4";
    ctx.fillRect(px + 4, py + 5, 1, 2);

    const bubble = 0.5 + 0.5 * Math.sin(now / 140 + x * 0.7);
    ctx.fillStyle = `rgba(200,255,230,${0.15 + bubble * 0.25})`;
    ctx.fillRect(px + 7, py + 4, 1, 1);
    ctx.fillRect(px + 6, py + 6, 1, 1);
  }
}
