import { HUNTER_COUNT_MAX, HUNTER_COUNT_MIN, HUNTER_MIN_DIST } from "../../config/constants";
import { randomOpenCellIndex } from "../../world/pathing";
import { cellKey } from "../../utils/grid";
import { distance } from "../../utils/math";
import type { Cell, Vec } from "../types";

function randomIntInRange(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffledCopy<T>(values: T[]) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function collectAvailableOpenCells(grid: Cell[][], taken: Set<string>) {
  const cells: Vec[] = [];
  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[0].length - 1; x += 1) {
      if (grid[y][x] === 1) continue;
      if (taken.has(cellKey(x, y))) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

export function pickActorSpawnCells(grid: Cell[][], taken: Set<string>) {
  const playerCell = randomOpenCellIndex(grid, taken);
  taken.add(cellKey(playerCell.x, playerCell.y));

  const availableOpenCells = collectAvailableOpenCells(grid, taken);
  const desiredCount = Math.min(
    availableOpenCells.length,
    randomIntInRange(HUNTER_COUNT_MIN, HUNTER_COUNT_MAX)
  );

  const farCells = shuffledCopy(
    availableOpenCells.filter((cell) => distance(playerCell, cell) >= HUNTER_MIN_DIST)
  );
  const nearCells = shuffledCopy(
    availableOpenCells.filter((cell) => distance(playerCell, cell) < HUNTER_MIN_DIST)
  );

  const hunterCells: Vec[] = [];
  for (const cell of farCells) {
    if (hunterCells.length >= desiredCount) break;
    hunterCells.push(cell);
  }
  for (const cell of nearCells) {
    if (hunterCells.length >= desiredCount) break;
    hunterCells.push(cell);
  }
  for (const cell of hunterCells) {
    taken.add(cellKey(cell.x, cell.y));
  }

  return { playerCell, hunterCells };
}
