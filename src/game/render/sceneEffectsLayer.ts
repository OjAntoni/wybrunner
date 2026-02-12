import { BOMB_RADIUS_TILES, TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";

export function drawExplosions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const explosion of state.explosions) {
    const age = now - explosion.start;
    const t = Math.min(age / 600, 1);
    const radius = (t * (BOMB_RADIUS_TILES + 1) + 0.4) * TILE_SIZE;
    const cx = explosion.x * TILE_SIZE - camX;
    const cy = explosion.y * TILE_SIZE - camY;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, ${140 + t * 80}, 70, ${0.5 - t * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
