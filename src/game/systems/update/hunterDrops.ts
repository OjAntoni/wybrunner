import type { GameState, Vec } from "../../model/types";
import { cellKey, inBounds } from "../../utils/grid";

const HEART_DROP_CHANCE = 0.3;
const COIN_DROP_CHANCE = 0.5;
const HUNTER_COIN_DROP_COUNT = 5;

function isDropCellAvailable(state: GameState, x: number, y: number) {
  if (!inBounds(x, y)) return false;
  if (state.grid[y][x] !== 0) return false;
  const key = cellKey(x, y);
  if (state.items.has(key)) return false;
  if (state.coins.has(key)) return false;
  if (state.lifeHearts.has(key)) return false;
  if (state.boosters.has(key)) return false;
  if (state.traps.has(key)) return false;
  if (state.spikes.has(key)) return false;
  if (state.undergroundTrapsHidden.has(key)) return false;
  if (state.undergroundTrapsRevealed.has(key)) return false;
  return true;
}

function shuffledOffsets(radius: number) {
  const offsets: Vec[] = [{ x: 0, y: 0 }];
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy > radius * radius) continue;
      offsets.push({ x: dx, y: dy });
    }
  }
  for (let i = offsets.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = offsets[i];
    offsets[i] = offsets[j];
    offsets[j] = tmp;
  }
  return offsets;
}

function placeLifeHeartDrop(state: GameState, cell: Vec) {
  const offsets = shuffledOffsets(2);
  for (const offset of offsets) {
    const x = cell.x + offset.x;
    const y = cell.y + offset.y;
    if (!isDropCellAvailable(state, x, y)) continue;
    state.lifeHearts.add(cellKey(x, y));
    return;
  }
}

function placeCoinDrops(state: GameState, cell: Vec) {
  const offsets = shuffledOffsets(3);
  let placed = 0;
  for (const offset of offsets) {
    if (placed >= HUNTER_COIN_DROP_COUNT) break;
    const x = cell.x + offset.x;
    const y = cell.y + offset.y;
    if (!isDropCellAvailable(state, x, y)) continue;
    state.coins.add(cellKey(x, y));
    placed += 1;
  }
}

export function applyHunterDeathDrop(state: GameState, hunterCell: Vec) {
  const roll = Math.random();
  if (roll < HEART_DROP_CHANCE) {
    placeLifeHeartDrop(state, hunterCell);
    return;
  }
  if (roll < HEART_DROP_CHANCE + COIN_DROP_CHANCE) {
    placeCoinDrops(state, hunterCell);
  }
}
