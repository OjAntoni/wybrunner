import { GRID_H, GRID_W } from "../../config/constants";
import { openRunLength } from "../../world/pathing";
import { cellKey, inBounds } from "../../utils/grid";
import type { ArrowThrower, Cell, Vec } from "../types";

const CARDINAL_DIRS: Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function placeArrowThrowers(grid: Cell[][], rng: () => number, baseNow: number) {
  const arrowThrowers: ArrowThrower[] = [];
  const throwerTarget = 10 + Math.floor(rng() * 6); // 10-15 inclusive
  const candidates: { x: number; y: number; dir: Vec }[] = [];

  // Arrow throwers: embedded in walls, firing down a clear corridor.
  for (let y = 1; y < GRID_H - 1; y += 1) {
    for (let x = 1; x < GRID_W - 1; x += 1) {
      if (grid[y][x] !== 1) continue;
      for (const dir of CARDINAL_DIRS) {
        const sx = x + dir.x;
        const sy = y + dir.y;
        if (!inBounds(sx, sy)) continue;
        if (grid[sy][sx] !== 0) continue;
        const len = openRunLength(grid, { x: sx, y: sy }, dir);
        if (len < 4) continue;
        candidates.push({ x, y, dir });
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const usedThrowerCells = new Set<string>();
  for (const candidate of candidates) {
    const k = cellKey(candidate.x, candidate.y);
    if (usedThrowerCells.has(k)) continue;
    usedThrowerCells.add(k);
    arrowThrowers.push({
      x: candidate.x,
      y: candidate.y,
      dir: candidate.dir,
      periodMs: 3000,
      // Randomize phase so they don't all fire on the same beat.
      nextFireMs: baseNow + (0.25 + rng() * 0.75) * 3000,
      lastFireMs: baseNow - 3000,
    });
    if (arrowThrowers.length >= throwerTarget) break;
  }

  return arrowThrowers;
}
