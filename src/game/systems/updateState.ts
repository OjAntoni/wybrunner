import type { GameState } from "../model/types";
import { updateHelpers } from "./helpers";
import { updateHunters } from "./update/hunter";
import { updateItems } from "./update/items";
import { updateMonster } from "./update/monster";
import { updatePlayerProgress } from "./update/playerProgress";
import { updateProjectiles } from "./update/projectiles";
import { updateTimedSystems } from "./update/timers";
import { updateTurrets } from "./update/turret";
import type { UpdateGameStateDeps } from "./update/types";

export type { UpdateGameStateDeps } from "./update/types";

export function updateGameState(
  state: GameState,
  dt: number,
  now: number,
  deps: UpdateGameStateDeps
) {
  const playerProgress = updatePlayerProgress(state, dt, now, deps);
  if (!playerProgress.alive) return;

  updateTurrets(state, dt, now);

  if (!updateProjectiles(state, dt, now, deps.onLoseReason)) return;

  updateItems(
    state,
    now,
    playerProgress.playerCell,
    playerProgress.playerKey,
    deps.onBombsLeft
  );

  updateTimedSystems(state, dt, now, playerProgress.playerCell);

  if (!updateMonster(state, dt, now, deps.touchEnabled, deps.onLoseReason)) return;
  if (!updateHunters(state, dt, now, deps.onLoseReason)) return;

  if (state.status === "playing" && state.helpers.length > 0) {
    updateHelpers(state, dt, now, deps.onLoseReason);
  }
}
