import { BOMB_RADIUS_TILES, GRID_H, GRID_W } from "../config/constants";
import type { Cell } from "../model/types";
import { cellKey, inBounds } from "../utils/grid";

export function blowUp(grid: Cell[][], cx: number, cy: number) {
  for (let dy = -BOMB_RADIUS_TILES; dy <= BOMB_RADIUS_TILES; dy += 1) {
    for (let dx = -BOMB_RADIUS_TILES; dx <= BOMB_RADIUS_TILES; dx += 1) {
      if (dx * dx + dy * dy > BOMB_RADIUS_TILES * BOMB_RADIUS_TILES) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (!inBounds(x, y)) continue;
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1) continue;
      grid[y][x] = 0;
    }
  }
}

export function keysInBlast(cx: number, cy: number) {
  const keys: string[] = [];
  for (let dy = -BOMB_RADIUS_TILES; dy <= BOMB_RADIUS_TILES; dy += 1) {
    for (let dx = -BOMB_RADIUS_TILES; dx <= BOMB_RADIUS_TILES; dx += 1) {
      if (dx * dx + dy * dy > BOMB_RADIUS_TILES * BOMB_RADIUS_TILES) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (!inBounds(x, y)) continue;
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1) continue;
      keys.push(cellKey(x, y));
    }
  }
  return keys;
}
