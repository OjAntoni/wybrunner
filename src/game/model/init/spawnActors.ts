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

  const farCells = availableOpenCells.filter(
    (cell) => distance(playerCell, cell) >= HUNTER_MIN_DIST
  );
  const nearCells = availableOpenCells.filter(
    (cell) => distance(playerCell, cell) < HUNTER_MIN_DIST
  );
  const candidateCells = farCells.length >= desiredCount ? farCells : [...farCells, ...nearCells];

  const hunterCells: Vec[] = [];
  const chosen = new Set<string>();

  if (candidateCells.length > 0) {
    let bestIndex = 0;
    let bestDist = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < candidateCells.length; i += 1) {
      const dist = distance(playerCell, candidateCells[i]);
      if (dist > bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    const first = candidateCells[bestIndex];
    hunterCells.push(first);
    chosen.add(cellKey(first.x, first.y));
  }

  while (hunterCells.length < desiredCount) {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < candidateCells.length; i += 1) {
      const cell = candidateCells[i];
      const key = cellKey(cell.x, cell.y);
      if (chosen.has(key)) continue;
      let minDist = Number.POSITIVE_INFINITY;
      for (const placed of hunterCells) {
        const dist = distance(placed, cell);
        if (dist < minDist) minDist = dist;
      }
      const score = minDist + (Math.random() - 0.5) * 0.25;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    const next = candidateCells[bestIndex];
    hunterCells.push(next);
    chosen.add(cellKey(next.x, next.y));
  }
  for (const cell of hunterCells) {
    taken.add(cellKey(cell.x, cell.y));
  }

  return { playerCell, hunterCells: shuffledCopy(hunterCells) };
}
