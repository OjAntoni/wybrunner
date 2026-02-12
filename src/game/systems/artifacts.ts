import { FOG_DURATION_MS } from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { spawnArtifactBoostersOrTraps } from "./artifactSpawns";
import { spawnFogAreas } from "./fogAreaSpawns";

function activateFogEffect(state: GameState, now: number, playerCell: Vec) {
  if (now >= state.fogUntil) {
    state.fogStart = now;
    state.fogUntil = now + FOG_DURATION_MS;
  } else {
    state.fogUntil = Math.max(state.fogUntil, now + FOG_DURATION_MS);
  }
  spawnFogAreas(state, now, playerCell);
}

export function triggerArtifactEffect(state: GameState, now: number, playerCell: Vec) {
  const effect = Math.floor(Math.random() * 3);

  // 0: boosters for chaser, 1: traps for player, 2: fog-of-war
  if (effect === 2) {
    activateFogEffect(state, now, playerCell);
    return;
  }

  spawnArtifactBoostersOrTraps(state, effect as 0 | 1, playerCell);
}
