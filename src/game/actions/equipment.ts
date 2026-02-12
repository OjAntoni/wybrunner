import { BOMB_RADIUS_TILES } from "../config/constants";
import type { GameState } from "../model/types";
import { cellKey, inBounds } from "../utils/grid";
import { blowUp, keysInBlast } from "../world/bombs";

export function placeSpike(state: GameState, onSpikesLeftChange: (next: number) => void) {
  if (state.status !== "playing") return;
  if (state.spikesLeft <= 0) return;
  const cell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  const key = cellKey(cell.x, cell.y);
  if (state.grid[cell.y][cell.x] === 1) return;
  if (state.items.has(key)) return;
  if (state.spikes.has(key)) return;
  state.spikes.add(key);
  state.spikesLeft -= 1;
  onSpikesLeftChange(state.spikesLeft);
}

export function placeBomb(state: GameState, onBombsLeftChange: (next: number) => void) {
  if (state.status !== "playing") return;
  if (state.bombsLeft <= 0) return;
  const cell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  if (!inBounds(cell.x, cell.y)) return;
  if (state.grid[cell.y][cell.x] === 1) return;
  blowUp(state.grid, cell.x, cell.y);
  // If a bomb breaks the wall containing an arrow thrower, it is destroyed.
  state.arrowThrowers = state.arrowThrowers.filter((t) => state.grid[t.y][t.x] === 1);
  // Bombs also destroy traps inside the blast.
  const blast = keysInBlast(cell.x, cell.y);
  const blastSet = new Set(blast);
  for (const k of blast) {
    state.traps.delete(k);
    state.undergroundTrapsHidden.delete(k);
    state.undergroundTrapsRevealed.delete(k);
    state.undergroundTrapRevealMs.delete(k);
  }
  state.arrows = state.arrows.filter((a) => {
    const ax = Math.floor(a.pos.x);
    const ay = Math.floor(a.pos.y);
    if (!inBounds(ax, ay)) return false;
    return state.grid[ay][ax] === 0;
  });
  state.helpers = state.helpers.filter((h) => {
    const hx = Math.floor(h.pos.x);
    const hy = Math.floor(h.pos.y);
    return !blastSet.has(cellKey(hx, hy));
  });
  state.explosions.push({
    x: cell.x + 0.5,
    y: cell.y + 0.5,
    start: performance.now(),
  });
  const monsterCell = {
    x: Math.floor(state.monster.x),
    y: Math.floor(state.monster.y),
  };
  if (
    (monsterCell.x - cell.x) * (monsterCell.x - cell.x) +
      (monsterCell.y - cell.y) * (monsterCell.y - cell.y) <=
    BOMB_RADIUS_TILES * BOMB_RADIUS_TILES
  ) {
    const now = performance.now();
    state.stunUntil = Math.max(state.stunUntil, now + 3000);
  }
  state.bombsLeft -= 1;
  onBombsLeftChange(state.bombsLeft);
}
