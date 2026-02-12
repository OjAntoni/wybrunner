import type { Cell, Vec } from "../model/types";
import { cellKey, inBounds } from "../utils/grid";
import { CARDINAL_DIRS } from "./pathingDirections";
import { bestNeighborStep } from "./pathingSteering";

export function bfsNextStep(grid: Cell[][], start: Vec, target: Vec): Vec {
  const queue: Vec[] = [start];
  const prev = new Map<string, string>();
  prev.set(cellKey(start.x, start.y), "");

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) break;

    for (const direction of CARDINAL_DIRS) {
      const nx = current.x + direction.x;
      const ny = current.y + direction.y;
      const key = cellKey(nx, ny);
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] === 1) continue;
      if (prev.has(key)) continue;
      prev.set(key, cellKey(current.x, current.y));
      queue.push({ x: nx, y: ny });
    }
  }

  const targetKey = cellKey(target.x, target.y);
  if (!prev.has(targetKey)) {
    return bestNeighborStep(grid, start, target);
  }

  let stepKey = targetKey;
  let parentKey = prev.get(stepKey)!;
  while (parentKey && parentKey !== cellKey(start.x, start.y)) {
    stepKey = parentKey;
    parentKey = prev.get(stepKey)!;
  }

  const [sx, sy] = stepKey.split(",").map(Number);
  return { x: sx - start.x, y: sy - start.y };
}
