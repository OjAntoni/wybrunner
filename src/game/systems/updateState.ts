import type { GameState } from "../model/types";
import { updateHelpers } from "./helpers";
import { updateEnemySenseIndicator } from "./update/enemySense";
import { updateHunters } from "./update/hunter";
import { updateItems } from "./update/items";
import { updateMonster } from "./update/monster";
import { updatePlayerProgress } from "./update/playerProgress";
import { updateProjectiles } from "./update/projectiles";
import { updateSwordHits } from "./update/sword";
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

  updateSwordHits(state, now);

  updateTurrets(state, dt, now);

  if (!updateProjectiles(state, dt, now)) return;

  updateItems(
    state,
    now,
    playerProgress.playerCell,
    playerProgress.playerKey
  );

  updateTimedSystems(state, dt, now, playerProgress.playerCell);

  if (!updateMonster(state, dt, now, deps.touchEnabled)) return;
  if (!updateHunters(state, dt, now)) return;
  updateEnemySenseIndicator(state, dt);

  if (state.status === "playing" && state.helpers.length > 0) {
    updateHelpers(state, dt, now);
  }
}
