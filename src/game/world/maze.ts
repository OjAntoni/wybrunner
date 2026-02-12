import { EXTRA_CONNECTION_RATIO, GRID_H, GRID_W } from "../config/constants";
import type { Cell, Vec } from "../model/types";
import { inBounds } from "../utils/grid";
import { shuffle } from "../utils/random";

export function generateMaze(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => 1)
  );

  const stack: Vec[] = [];
  const start: Vec = { x: 1, y: 1 };
  grid[start.y][start.x] = 0;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const dirs = shuffle([
      { x: 2, y: 0 },
      { x: -2, y: 0 },
      { x: 0, y: 2 },
      { x: 0, y: -2 },
    ]);

    let carved = false;
    for (const d of dirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (!inBounds(nx, ny)) continue;
      if (nx <= 0 || ny <= 0 || nx >= GRID_W - 1 || ny >= GRID_H - 1) continue;
      if (grid[ny][nx] === 1) {
        grid[ny][nx] = 0;
        grid[current.y + d.y / 2][current.x + d.x / 2] = 0;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }

  for (let x = 0; x < GRID_W; x += 1) {
    grid[0][x] = 1;
    grid[GRID_H - 1][x] = 1;
  }
  for (let y = 0; y < GRID_H; y += 1) {
    grid[y][0] = 1;
    grid[y][GRID_W - 1] = 1;
  }

  addExtraConnections(grid, EXTRA_CONNECTION_RATIO);

  return grid;
}

function addExtraConnections(grid: Cell[][], ratio: number) {
  const candidates: Vec[] = [];
  for (let y = 1; y < GRID_H - 1; y += 1) {
    for (let x = 1; x < GRID_W - 1; x += 1) {
      if (grid[y][x] !== 1) continue;
      const openLeft = grid[y][x - 1] === 0;
      const openRight = grid[y][x + 1] === 0;
      const openUp = grid[y - 1][x] === 0;
      const openDown = grid[y + 1][x] === 0;
      if (openLeft && openRight) {
        candidates.push({ x, y });
      } else if (openUp && openDown) {
        candidates.push({ x, y });
      }
    }
  }
  shuffle(candidates);
  const removeCount = Math.floor(candidates.length * ratio);
  for (let i = 0; i < removeCount; i += 1) {
    const cell = candidates[i];
    grid[cell.y][cell.x] = 0;
  }
}
