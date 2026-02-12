import { GRID_H, GRID_W } from "../config/constants";
import type { Cell, Vec } from "../model/types";

export function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}

export function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export function packCell(x: number, y: number) {
  return y * GRID_W + x;
}

export function unpackCell(packed: number): Vec {
  const y = Math.floor(packed / GRID_W);
  const x = packed - y * GRID_W;
  return { x, y };
}

export function cellCenter(cell: Vec): Vec {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

export function openNeighbors(grid: Cell[][], cell: Vec) {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const out: Vec[] = [];
  for (const d of dirs) {
    const nx = cell.x + d.x;
    const ny = cell.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 0) out.push({ x: nx, y: ny });
  }
  return out;
}

export function countOpenNeighbors(grid: Cell[][], cell: Vec) {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  let count = 0;
  for (const d of dirs) {
    const nx = cell.x + d.x;
    const ny = cell.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 0) count += 1;
  }
  return count;
}
