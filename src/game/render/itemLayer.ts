import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { parseCellKey } from "./collectibleShared";

export function drawItems(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  for (const key of state.items) {
    const [x, y] = parseCellKey(key);
    const itemCenterX = x * TILE_SIZE + TILE_SIZE / 2;
    const itemCenterY = y * TILE_SIZE + TILE_SIZE / 2;
    const sx = itemCenterX - camX;
    const sy = itemCenterY - camY;
    const onScreen = sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH;
    if (!onScreen) continue;

    const pulse = 0.5 + 0.5 * Math.sin(now / 180 + (x * 0.7 + y * 0.4));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 220, 120, ${0.1 + pulse * 0.18})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 12 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 7 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#f6c945";
    ctx.fillRect(x * TILE_SIZE - camX + 2, y * TILE_SIZE - camY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = `rgba(255,255,255,${0.08 + pulse * 0.14})`;
    ctx.fillRect(x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + 4, 2, 1);
  }
}
