import type { Cell, Vec } from "../model/types";
import { inBounds } from "../utils/grid";
import { distance } from "../utils/math";
import { CARDINAL_DIRS } from "./pathingDirections";

export function bestNeighborStep(grid: Cell[][], start: Vec, target: Vec): Vec {
  let best: Vec = { x: 0, y: 0 };
  let bestDist = Number.POSITIVE_INFINITY;
  for (const direction of CARDINAL_DIRS) {
    const nx = start.x + direction.x;
    const ny = start.y + direction.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 1) continue;
    const dist = distance({ x: nx, y: ny }, target);
    if (dist < bestDist) {
      bestDist = dist;
      best = direction;
    }
  }
  return best;
}

export function bestNeighborStepAvoid(
  grid: Cell[][],
  start: Vec,
  target: Vec,
  avoid: Vec
): Vec {
  let best: Vec = avoid;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const direction of CARDINAL_DIRS) {
    if (direction.x === avoid.x && direction.y === avoid.y) continue;
    const nx = start.x + direction.x;
    const ny = start.y + direction.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 1) continue;
    const dist = distance({ x: nx, y: ny }, target);
    if (dist < bestDist) {
      bestDist = dist;
      best = direction;
    }
  }
  return best;
}
