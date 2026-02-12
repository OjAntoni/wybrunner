import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import type { VisibleTileBounds } from "./sceneTypes";

function parseCellKey(key: string): [number, number] {
  const [x, y] = key.split(",").map(Number);
  return [x, y];
}

function isWithinBounds(x: number, y: number, bounds: VisibleTileBounds) {
  return x >= bounds.startX && x <= bounds.endX && y >= bounds.startY && y <= bounds.endY;
}

export function drawTraps(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (const key of state.traps) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const px = x * TILE_SIZE - camX;
    const py = y * TILE_SIZE - camY;
    const blink = Math.sin(now / 90 + (x - y) * 0.4) > 0;
    ctx.fillStyle = blink ? "#ff3b3b" : "#a01616";
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.fillStyle = blink ? "#ffd1d1" : "#ff7a7a";
    ctx.fillRect(px + 4, py + 4, 1, 1);
    ctx.fillRect(px + 6, py + 6, 1, 1);
    ctx.fillRect(px + 5, py + 7, 2, 1);
  }
}

export function drawRevealedUndergroundTraps(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  for (const key of state.undergroundTrapsRevealed) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const px = x * TILE_SIZE - camX;
    const py = y * TILE_SIZE - camY;
    const openedAt = state.undergroundTrapRevealMs.get(key) ?? 0;
    const age = Math.max(0, now - openedAt);
    const pop = 1 - Math.exp(-age / 180);
    const bob = (1 - pop) * 6;

    ctx.fillStyle = "#c9d2ff";
    ctx.beginPath();
    ctx.moveTo(px + TILE_SIZE / 2, py + 3 + bob);
    ctx.lineTo(px + 9, py + TILE_SIZE - 3);
    ctx.lineTo(px + 3, py + TILE_SIZE - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5c6a8a";
    ctx.fillRect(px + 3, py + TILE_SIZE - 4, TILE_SIZE - 6, 2);
  }
}

export function drawSpikes(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  bounds: VisibleTileBounds
) {
  const pulse = 0.5 + 0.5 * Math.sin(now / 160);
  for (const key of state.spikes) {
    const [x, y] = parseCellKey(key);
    if (!isWithinBounds(x, y, bounds)) continue;

    const inset = 2 + pulse * 2;
    ctx.fillStyle = `rgb(180, ${80 + pulse * 80}, 255)`;
    ctx.fillRect(
      x * TILE_SIZE - camX + inset,
      y * TILE_SIZE - camY + inset,
      TILE_SIZE - inset * 2,
      TILE_SIZE - inset * 2
    );
  }
}
