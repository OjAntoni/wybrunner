import { PLAYER_SPEED } from "../../config/constants";
import type { GameState, Vec } from "../../model/types";
import { cellKey } from "../../utils/grid";
import { clearExploreClouds, updateDiscoveredArtifacts } from "../../world/exploration";
import { tryMove } from "../movement";
import { loseGame } from "../outcome";
import type { UpdateGameStateDeps } from "./types";

type PlayerProgressDeps = Pick<
  UpdateGameStateDeps,
  "getInputDir" | "touchEnabled" | "onCoinsCollected" | "onLoseReason"
>;

export type PlayerProgressResult = {
  playerCell: Vec;
  playerKey: string;
  alive: boolean;
};

export function updatePlayerProgress(
  state: GameState,
  dt: number,
  now: number,
  deps: PlayerProgressDeps
): PlayerProgressResult {
  const prevPlayerCell = { x: state.lastPlayerCell.x, y: state.lastPlayerCell.y };
  const move = deps.getInputDir();
  const moveLength = Math.hypot(move.x, move.y);
  if (moveLength > 0.0001) {
    state.playerFacing = {
      x: move.x / moveLength,
      y: move.y / moveLength,
    };
  }
  const playerSpeed = PLAYER_SPEED * dt;
  state.player = tryMove(state.grid, state.player, move, playerSpeed, deps.touchEnabled);

  const playerCell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  const playerKey = cellKey(playerCell.x, playerCell.y);
  const prevKey = cellKey(prevPlayerCell.x, prevPlayerCell.y);
  const enteredNewCell = playerKey !== prevKey;
  state.lastPlayerCell = { x: playerCell.x, y: playerCell.y };

  if (!state.exploreInitialized) {
    clearExploreClouds(state, playerCell, now, true);
    state.exploreInitialized = true;
    updateDiscoveredArtifacts(state);
  }

  if (state.coins.has(playerKey)) {
    state.coins.delete(playerKey);
    state.coinsCollected += 1;
    deps.onCoinsCollected(state.coinsCollected);
  }

  if (enteredNewCell) {
    clearExploreClouds(state, playerCell, now);
    updateDiscoveredArtifacts(state);

    // Underground traps are invisible until first stepped on; second entry kills.
    if (state.undergroundTrapsHidden.has(playerKey)) {
      state.undergroundTrapsHidden.delete(playerKey);
      state.undergroundTrapsRevealed.add(playerKey);
      state.undergroundTrapRevealMs.set(playerKey, now);
    } else if (state.undergroundTrapsRevealed.has(playerKey)) {
      loseGame(state, "trap", deps.onLoseReason);
      return { playerCell, playerKey, alive: false };
    }
  }

  if (state.traps.has(playerKey)) {
    loseGame(state, "trap", deps.onLoseReason);
    return { playerCell, playerKey, alive: false };
  }

  return { playerCell, playerKey, alive: true };
}
