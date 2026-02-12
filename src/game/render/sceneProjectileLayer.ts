import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";

export function drawArrows(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  if (state.arrows.length === 0) return;

  ctx.save();
  ctx.fillStyle = "#a7adb8";
  for (const arrow of state.arrows) {
    const ax = arrow.pos.x * TILE_SIZE - camX;
    const ay = arrow.pos.y * TILE_SIZE - camY;
    if (ax < -20 || ay < -20 || ax > viewW + 20 || ay > viewH + 20) continue;

    let rot = 0;
    if (arrow.dir.x === 1) rot = 0;
    else if (arrow.dir.x === -1) rot = Math.PI;
    else if (arrow.dir.y === 1) rot = Math.PI / 2;
    else rot = -Math.PI / 2;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rot);
    ctx.fillRect(-6, -1, 9, 2);
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(0, -3);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
