import { GRID_H, GRID_W } from "../config/constants";
import type { Cell, Vec } from "../model/types";
import { cellKey, inBounds } from "../utils/grid";

export function openRunLength(grid: Cell[][], start: Vec, dir: Vec) {
  let len = 0;
  let x = start.x;
  let y = start.y;
  while (inBounds(x, y) && grid[y][x] === 0) {
    len += 1;
    x += dir.x;
    y += dir.y;
  }
  return len;
}

export function randomOpenCellIndex(grid: Cell[][], exclude: Set<string>) {
  while (true) {
    const x = 1 + Math.floor(Math.random() * (GRID_W - 2));
    const y = 1 + Math.floor(Math.random() * (GRID_H - 2));
    if (grid[y][x] === 0 && !exclude.has(cellKey(x, y))) {
      return { x, y };
    }
  }
}

export function randomOpenCellIndexFar(
  grid: Cell[][],
  exclude: Set<string>,
  from: Vec,
  minDistTiles: number
) {
  const minDistSq = minDistTiles * minDistTiles;
  let tries = 0;
  while (tries < 20000) {
    tries += 1;
    const cell = randomOpenCellIndex(grid, exclude);
    const dx = cell.x - from.x;
    const dy = cell.y - from.y;
    if (dx * dx + dy * dy >= minDistSq) return cell;
  }
  // Fallback: accept any open cell if the map is too cramped.
  return randomOpenCellIndex(grid, exclude);
}
