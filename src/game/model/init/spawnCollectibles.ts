import {
  COINS_TARGET,
  GRID_H,
  GRID_W,
  LIFE_HEARTS_TARGET,
  ITEMS_TARGET,
  UNDERGROUND_TRAPS_TARGET,
} from "../../config/constants";
import { randomOpenCellIndex } from "../../world/pathing";
import { cellKey } from "../../utils/grid";
import type { Cell } from "../types";

export function placeItems(grid: Cell[][], taken: Set<string>) {
  const items = new Set<string>();
  while (items.size < ITEMS_TARGET) {
    const item = randomOpenCellIndex(grid, taken);
    items.add(cellKey(item.x, item.y));
  }
  return items;
}

export function placeCoins(
  grid: Cell[][],
  taken: Set<string>,
  items: Set<string>,
  rng: () => number
) {
  const coins = new Set<string>();
  const cols = 10;
  const rows = 10;
  const regionW = GRID_W / cols;
  const regionH = GRID_H / rows;

  // Stratified coin placement: roughly even spread across the map.
  for (let i = 0; i < COINS_TARGET; i += 1) {
    const rx = i % cols;
    const ry = Math.floor(i / cols) % rows;
    const x0 = Math.max(1, Math.floor(rx * regionW));
    const x1 = Math.min(GRID_W - 2, Math.floor((rx + 1) * regionW) - 1);
    const y0 = Math.max(1, Math.floor(ry * regionH));
    const y1 = Math.min(GRID_H - 2, Math.floor((ry + 1) * regionH) - 1);

    let placed = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = Math.max(1, Math.min(GRID_W - 2, x0 + Math.floor(rng() * (x1 - x0 + 1))));
      const y = Math.max(1, Math.min(GRID_H - 2, y0 + Math.floor(rng() * (y1 - y0 + 1))));
      if (grid[y][x] !== 0) continue;
      const k = cellKey(x, y);
      if (taken.has(k)) continue;
      if (items.has(k)) continue; // Keep coins separate from artifacts.
      coins.add(k);
      taken.add(k);
      placed = true;
      break;
    }
    if (placed) continue;

    // Fallback: anywhere open.
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const x = 1 + Math.floor(rng() * (GRID_W - 2));
      const y = 1 + Math.floor(rng() * (GRID_H - 2));
      if (grid[y][x] !== 0) continue;
      const k = cellKey(x, y);
      if (taken.has(k)) continue;
      if (items.has(k)) continue;
      coins.add(k);
      taken.add(k);
      break;
    }
  }
  return coins;
}

function parseCellKey(key: string): [number, number] {
  const [x, y] = key.split(",");
  return [Number(x), Number(y)];
}

function shuffledOffsets(rng: () => number) {
  const offsets = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];
  for (let i = offsets.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = offsets[i];
    offsets[i] = offsets[j];
    offsets[j] = tmp;
  }
  return offsets;
}

export function placeLifeHeartsNearArtifacts(
  grid: Cell[][],
  taken: Set<string>,
  items: Set<string>,
  rng: () => number
) {
  const lifeHearts = new Set<string>();
  const artifacts = [...items];
  for (let i = artifacts.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = artifacts[i];
    artifacts[i] = artifacts[j];
    artifacts[j] = tmp;
  }

  for (const artifactKey of artifacts) {
    if (lifeHearts.size >= LIFE_HEARTS_TARGET) break;
    const [ax, ay] = parseCellKey(artifactKey);
    const offsets = shuffledOffsets(rng);
    for (const offset of offsets) {
      const x = ax + offset.x;
      const y = ay + offset.y;
      if (x <= 0 || y <= 0 || x >= GRID_W - 1 || y >= GRID_H - 1) continue;
      if (grid[y][x] !== 0) continue;
      const key = cellKey(x, y);
      if (taken.has(key)) continue;
      if (items.has(key)) continue;
      lifeHearts.add(key);
      taken.add(key);
      break;
    }
  }

  while (lifeHearts.size < LIFE_HEARTS_TARGET) {
    const cell = randomOpenCellIndex(grid, taken);
    const key = cellKey(cell.x, cell.y);
    if (items.has(key)) continue;
    lifeHearts.add(key);
    taken.add(key);
  }

  return lifeHearts;
}

export function placeUndergroundTraps(
  grid: Cell[][],
  taken: Set<string>,
  items: Set<string>,
  coins: Set<string>
) {
  const undergroundTrapsHidden = new Set<string>();
  while (undergroundTrapsHidden.size < UNDERGROUND_TRAPS_TARGET) {
    const cell = randomOpenCellIndex(grid, taken);
    const k = cellKey(cell.x, cell.y);
    if (items.has(k) || coins.has(k)) continue;
    undergroundTrapsHidden.add(k);
    taken.add(k);
  }
  return undergroundTrapsHidden;
}
