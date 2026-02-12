import { FOG_AREA_MIN_DIST, GRID_H, GRID_W } from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { packCell } from "../utils/grid";

export function getFogMinDistanceSq() {
  return FOG_AREA_MIN_DIST * FOG_AREA_MIN_DIST;
}

export function buildOccupiedFogCells(state: GameState) {
  const occupied = new Set<number>();
  for (const area of state.fogAreas) {
    for (const cell of area.cells) occupied.add(cell);
  }
  return occupied;
}

export function pickFogSeed(
  state: GameState,
  rng: () => number,
  playerCell: Vec,
  occupied: Set<number>,
  minDistSq: number
) {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const x = 1 + Math.floor(rng() * (GRID_W - 2));
    const y = 1 + Math.floor(rng() * (GRID_H - 2));
    if (state.grid[y][x] !== 0) continue;
    const dx = x - playerCell.x;
    const dy = y - playerCell.y;
    if (dx * dx + dy * dy < minDistSq) continue;
    const packed = packCell(x, y);
    if (occupied.has(packed)) continue;
    return { x, y };
  }
  return null;
}
