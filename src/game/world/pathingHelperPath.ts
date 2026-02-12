import type { Cell, Vec } from "../model/types";
import { cellKey, openNeighbors } from "../utils/grid";

export function generateHelperPath(
  grid: Cell[][],
  start: Vec,
  minLen: number,
  rng: () => number
): Vec[] | null {
  const path: Vec[] = [start];
  const visited = new Set<string>([cellKey(start.x, start.y)]);
  while (path.length < minLen) {
    const current = path[path.length - 1];
    const candidates = openNeighbors(grid, current).filter(
      (candidate) => !visited.has(cellKey(candidate.x, candidate.y))
    );
    if (candidates.length === 0) return null;
    const next = candidates[Math.floor(rng() * candidates.length)];
    path.push(next);
    visited.add(cellKey(next.x, next.y));
  }
  return path;
}
