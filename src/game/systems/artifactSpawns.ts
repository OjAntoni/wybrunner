import type { GameState, Vec } from "../model/types";
import { cellKey } from "../utils/grid";


function isCellExcluded(state: GameState, playerCell: Vec, x: number, y: number): boolean {
  const key = cellKey(x, y);
  if (state.items.has(key)) return true;
  if (state.coins.has(key)) return true;
  if (state.undergroundTrapsHidden.has(key)) return true;
  if (state.undergroundTrapsRevealed.has(key)) return true;
  if (state.spikes.has(key)) return true;
  if (state.boosters.has(key)) return true;
  if (state.traps.has(key)) return true;
  if (playerCell.x === x && playerCell.y === y) return true;
  
  for (const monster of state.monsters) {
    if (Math.floor(monster.pos.x) === x && Math.floor(monster.pos.y) === y) return true;
  }
  for (const hunter of state.hunters) {
    if (Math.floor(hunter.pos.x) === x && Math.floor(hunter.pos.y) === y) return true;
  }
  for (const turret of state.turrets) {
    if (Math.floor(turret.pos.x) === x && Math.floor(turret.pos.y) === y) return true;
  }
  return false;
}

export function spawnArtifactBoostersOrTraps(
  state: GameState,
  effect: 0 | 1,
  playerCell: Vec
) {
  const targetSet = effect === 0 ? state.boosters : state.traps;
  const exclude = new Set<string>();
  
  for (let i = 0; i < 3; i += 1) {
    // Use pre-computed open cells list for fast random selection
    let cell: Vec | null = null;
    
    // Try up to 50 random picks from open cells
    for (let tries = 0; tries < 50; tries++) {
      const idx = Math.floor(Math.random() * state.openCells.length);
      const candidate = state.openCells[idx];
      const key = cellKey(candidate.x, candidate.y);
      
      if (!exclude.has(key) && !isCellExcluded(state, playerCell, candidate.x, candidate.y)) {
        cell = candidate;
        break;
      }
    }
    
    // Fallback: scan through open cells linearly
    if (!cell) {
      for (const candidate of state.openCells) {
        const key = cellKey(candidate.x, candidate.y);
        if (!exclude.has(key) && !isCellExcluded(state, playerCell, candidate.x, candidate.y)) {
          cell = candidate;
          break;
        }
      }
    }
    
    if (cell) {
      const key = cellKey(cell.x, cell.y);
      targetSet.add(key);
      exclude.add(key);
    }
  }
}
