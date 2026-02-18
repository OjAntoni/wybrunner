import { BOMB_RADIUS_TILES, TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";

export function drawExplosions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  const maxRadius = (BOMB_RADIUS_TILES + 1.4) * TILE_SIZE;
  for (const explosion of state.explosions) {
    const cx = explosion.x * TILE_SIZE - camX;
    const cy = explosion.y * TILE_SIZE - camY;
    // Viewport culling with padding for explosion radius
    if (cx < -maxRadius || cy < -maxRadius || cx > viewW + maxRadius || cy > viewH + maxRadius) continue;

    const age = now - explosion.start;
    const t = Math.min(age / 600, 1);
    const radius = (t * (BOMB_RADIUS_TILES + 1) + 0.4) * TILE_SIZE;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, ${140 + t * 80}, 70, ${0.5 - t * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawCoinPickupBursts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  const maxBurstRadius = 10; // 2 + 1.0 * 7 + padding
  for (const burst of state.coinPickupBursts) {
    const cx = burst.x * TILE_SIZE - camX;
    const cy = burst.y * TILE_SIZE - camY;
    // Viewport culling with padding for burst radius
    if (cx < -maxBurstRadius || cy < -maxBurstRadius || cx > viewW + maxBurstRadius || cy > viewH + maxBurstRadius) continue;

    const age = Math.max(0, now - burst.start);
    const t = Math.min(age / 220, 1);
    const ease = 1 - (1 - t) * (1 - t);
    const alpha = 0.45 * (1 - t);
    if (alpha <= 0.001) continue;

    const radius = 2 + ease * 7;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 220, 110, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
