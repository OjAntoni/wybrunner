import type { GameState, Vec } from "../model/types";
import { cellKey } from "../utils/grid";
import { randomOpenCellIndex } from "../world/pathing";

function buildArtifactExclusionSet(state: GameState, playerCell: Vec) {
  const exclude = new Set<string>();
  state.items.forEach((k) => exclude.add(k));
  state.coins.forEach((k) => exclude.add(k));
  state.undergroundTrapsHidden.forEach((k) => exclude.add(k));
  state.undergroundTrapsRevealed.forEach((k) => exclude.add(k));
  state.spikes.forEach((k) => exclude.add(k));
  state.boosters.forEach((k) => exclude.add(k));
  state.traps.forEach((k) => exclude.add(k));
  exclude.add(cellKey(playerCell.x, playerCell.y));
  exclude.add(cellKey(Math.floor(state.monster.x), Math.floor(state.monster.y)));
  return exclude;
}

export function spawnArtifactBoostersOrTraps(
  state: GameState,
  effect: 0 | 1,
  playerCell: Vec
) {
  const exclude = buildArtifactExclusionSet(state, playerCell);
  const targetSet = effect === 0 ? state.boosters : state.traps;
  for (let i = 0; i < 3; i += 1) {
    const cell = randomOpenCellIndex(state.grid, exclude);
    const key = cellKey(cell.x, cell.y);
    targetSet.add(key);
    exclude.add(key);
  }
}
