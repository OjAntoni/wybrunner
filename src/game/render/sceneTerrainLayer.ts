import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import type { VisibleTileBounds } from "./sceneTypes";

function isWithinBounds(x: number, y: number, bounds: VisibleTileBounds) {
  return x >= bounds.startX && x <= bounds.endX && y >= bounds.startY && y <= bounds.endY;
}

export function drawTerrainTiles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (let y = bounds.startY; y <= bounds.endY; y += 1) {
    for (let x = bounds.startX; x <= bounds.endX; x += 1) {
      ctx.fillStyle = state.grid[y][x] === 1 ? "#1f1f2b" : "#0f3b2e";
      ctx.fillRect(x * TILE_SIZE - camX, y * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
    }
  }
}

export function drawArrowThrowers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  const fireAnimMs = 260;
  const windupMs = 500;
  for (const thrower of state.arrowThrowers) {
    if (!isWithinBounds(thrower.x, thrower.y, bounds)) continue;
    if (state.grid[thrower.y][thrower.x] !== 1) continue;

    const px = thrower.x * TILE_SIZE - camX;
    const py = thrower.y * TILE_SIZE - camY;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const fireAge = now - thrower.lastFireMs;
    const fireT = Math.max(0, Math.min(1, fireAge / fireAnimMs));
    const firePulse = fireAge >= 0 && fireAge <= fireAnimMs ? Math.sin(fireT * Math.PI) : 0;
    const windupStart = thrower.nextFireMs - windupMs;
    const windupT = Math.max(0, Math.min(1, (now - windupStart) / windupMs));
    const windupEase = now >= windupStart && now <= thrower.nextFireMs
      ? windupT * windupT * (3 - 2 * windupT)
      : 0;
    const windupNudge = windupEase * 2.2;
    const nudge = windupNudge + firePulse * 1.2;
    const flashAlpha = Math.max(windupEase * 0.45, firePulse * 0.6);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = "#7a8396";

    if (thrower.dir.x === 1) {
      ctx.fillRect(px + 4, cy - 1, TILE_SIZE - 9 + nudge, 2);
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE - 2 + nudge, cy);
      ctx.lineTo(px + TILE_SIZE - 7 + nudge, cy - 3);
      ctx.lineTo(px + TILE_SIZE - 7 + nudge, cy + 3);
      ctx.closePath();
      ctx.fill();
      if (flashAlpha > 0.001) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(230, 236, 246, ${flashAlpha.toFixed(3)})`;
        ctx.fillRect(px + 4, cy - 1, TILE_SIZE - 9 + nudge, 2);
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE - 2 + nudge, cy);
        ctx.lineTo(px + TILE_SIZE - 7 + nudge, cy - 3);
        ctx.lineTo(px + TILE_SIZE - 7 + nudge, cy + 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      continue;
    }

    if (thrower.dir.x === -1) {
      ctx.fillRect(px + 5 - nudge, cy - 1, TILE_SIZE - 9 + nudge, 2);
      ctx.beginPath();
      ctx.moveTo(px + 2 - nudge, cy);
      ctx.lineTo(px + 7 - nudge, cy - 3);
      ctx.lineTo(px + 7 - nudge, cy + 3);
      ctx.closePath();
      ctx.fill();
      if (flashAlpha > 0.001) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(230, 236, 246, ${flashAlpha.toFixed(3)})`;
        ctx.fillRect(px + 5 - nudge, cy - 1, TILE_SIZE - 9 + nudge, 2);
        ctx.beginPath();
        ctx.moveTo(px + 2 - nudge, cy);
        ctx.lineTo(px + 7 - nudge, cy - 3);
        ctx.lineTo(px + 7 - nudge, cy + 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      continue;
    }

    if (thrower.dir.y === 1) {
      ctx.fillRect(cx - 1, py + 4, 2, TILE_SIZE - 9 + nudge);
      ctx.beginPath();
      ctx.moveTo(cx, py + TILE_SIZE - 2 + nudge);
      ctx.lineTo(cx - 3, py + TILE_SIZE - 7 + nudge);
      ctx.lineTo(cx + 3, py + TILE_SIZE - 7 + nudge);
      ctx.closePath();
      ctx.fill();
      if (flashAlpha > 0.001) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(230, 236, 246, ${flashAlpha.toFixed(3)})`;
        ctx.fillRect(cx - 1, py + 4, 2, TILE_SIZE - 9 + nudge);
        ctx.beginPath();
        ctx.moveTo(cx, py + TILE_SIZE - 2 + nudge);
        ctx.lineTo(cx - 3, py + TILE_SIZE - 7 + nudge);
        ctx.lineTo(cx + 3, py + TILE_SIZE - 7 + nudge);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      continue;
    }

    ctx.fillRect(cx - 1, py + 5 - nudge, 2, TILE_SIZE - 9 + nudge);
    ctx.beginPath();
    ctx.moveTo(cx, py + 2 - nudge);
    ctx.lineTo(cx - 3, py + 7 - nudge);
    ctx.lineTo(cx + 3, py + 7 - nudge);
    ctx.closePath();
    ctx.fill();
    if (flashAlpha > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(230, 236, 246, ${flashAlpha.toFixed(3)})`;
      ctx.fillRect(cx - 1, py + 5 - nudge, 2, TILE_SIZE - 9 + nudge);
      ctx.beginPath();
      ctx.moveTo(cx, py + 2 - nudge);
      ctx.lineTo(cx - 3, py + 7 - nudge);
      ctx.lineTo(cx + 3, py + 7 - nudge);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
