import { ITEMS_TARGET } from "../../config/constants";
import type { GameState, Vec } from "../../model/types";
import { triggerArtifactEffect } from "../artifacts";
import { spawnHelpers } from "../helpers";

export function updateItems(
  state: GameState,
  now: number,
  playerCell: Vec,
  playerKey: string,
  onBombsLeft: (value: number) => void
) {
  if (!state.items.has(playerKey)) return;

  const collectedAfter = ITEMS_TARGET - (state.items.size - 1);
  state.items.delete(playerKey);

  if (Math.random() < 0.5) {
    state.bombsLeft = Math.min(3, state.bombsLeft + 1);
    onBombsLeft(state.bombsLeft);
  }

  if (state.items.size === 0) {
    state.status = "win";
  } else {
    triggerArtifactEffect(state, now, playerCell);
  }

  if (!state.helpersSpawned && collectedAfter >= 5 && state.status === "playing") {
    spawnHelpers(state, playerCell);
    state.helpersSpawned = true;
  }
}
