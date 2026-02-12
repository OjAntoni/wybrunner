import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { isWithinBounds, parseCellKey } from "./collectibleShared";
import type { VisibleTileBounds } from "./sceneTypes";

export function drawCoins(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (const key of state.coins) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const cx = x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const cy = y * TILE_SIZE + TILE_SIZE / 2 - camY;
    ctx.fillStyle = "#ffd65c";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 3.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx + 0.6, cy + 0.4, 1.6, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(cx - 1, cy - 2, 1, 1);
  }
}
