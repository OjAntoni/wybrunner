import { GRID_H, GRID_W } from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { packCell, unpackCell } from "../utils/grid";
import { clampInt } from "../utils/math";

const cardinalDirs: Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export type FogCellGrowth = {
  cells: number[];
  cellSet: Set<number>;
};

export function growFogCells(
  state: GameState,
  rng: () => number,
  playerCell: Vec,
  occupied: Set<number>,
  minDistSq: number,
  seed: Vec,
  targetSize: number
): FogCellGrowth {
  const cells: number[] = [];
  const cellSet = new Set<number>();
  const frontier: number[] = [];

  const seedPacked = packCell(seed.x, seed.y);
  cells.push(seedPacked);
  cellSet.add(seedPacked);
  occupied.add(seedPacked);
  frontier.push(seedPacked);

  while (cells.length < targetSize && frontier.length > 0) {
    const baseIdx = Math.floor(rng() * frontier.length);
    const base = unpackCell(frontier[baseIdx]);

    // Try a few random neighbor expansions; if none works, retire this frontier cell.
    let added = false;
    for (let tries = 0; tries < 6; tries += 1) {
      const direction = cardinalDirs[Math.floor(rng() * cardinalDirs.length)];
      const nx = base.x + direction.x;
      const ny = base.y + direction.y;
      if (nx <= 0 || ny <= 0 || nx >= GRID_W - 1 || ny >= GRID_H - 1) continue;
      if (state.grid[ny][nx] !== 0) continue;
      const dx = nx - playerCell.x;
      const dy = ny - playerCell.y;
      if (dx * dx + dy * dy < minDistSq) continue;
      const packed = packCell(nx, ny);
      if (cellSet.has(packed) || occupied.has(packed)) continue;
      cells.push(packed);
      cellSet.add(packed);
      occupied.add(packed);
      frontier.push(packed);
      added = true;
      break;
    }
    if (!added) {
      frontier.splice(baseIdx, 1);
    }
  }

  return { cells, cellSet };
}

export function buildFogAnchors(cells: number[], rng: () => number) {
  const anchors: { x: number; y: number; r: number }[] = [];
  const anchorCount = clampInt(10 + Math.floor(rng() * 10), 10, 22);
  for (let i = 0; i < anchorCount; i += 1) {
    const packed = cells[Math.floor(rng() * cells.length)];
    const cell = unpackCell(packed);
    anchors.push({
      x: cell.x + 0.5,
      y: cell.y + 0.5,
      r: 1.8 + rng() * 3.2,
    });
  }
  return anchors;
}
