import { PLAYER_SPEED } from "../../config/constants";
import type { GameState, Vec } from "../../model/types";
import { cellKey } from "../../utils/grid";
import { clearExploreClouds, updateDiscoveredArtifacts } from "../../world/exploration";
import { tryMove } from "../movement";
import { applyPlayerEnemyHit } from "./playerDamage";
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
  const indicatorTarget = state.playerFacing;
  const indicator = state.playerFacingIndicator;
  const dot = indicator.x * indicatorTarget.x + indicator.y * indicatorTarget.y;
  const cross = indicator.x * indicatorTarget.y - indicator.y * indicatorTarget.x;
  const crossAbs = Math.abs(cross);
  if (crossAbs > 0.0001) {
    state.playerFacingTurnDir = cross > 0 ? 1 : -1;
  }
  const turnBoost = dot < -0.2 ? 2.2 : 1;
  const indicatorLerp = 1 - Math.exp(-dt * 10 * turnBoost);
  const currentAngle = Math.atan2(indicator.y, indicator.x);
  const targetAngle = Math.atan2(indicatorTarget.y, indicatorTarget.x);
  let angleDelta = normalizeAngle(targetAngle - currentAngle);
  if (crossAbs <= 0.0001 && dot < 0) {
    angleDelta = state.playerFacingTurnDir * Math.PI;
  }
  const nextAngle = currentAngle + angleDelta * indicatorLerp;
  indicator.x = Math.cos(nextAngle);
  indicator.y = Math.sin(nextAngle);
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

    // Underground traps reveal only after leaving the first step; re-entry is lethal.
    if (state.undergroundTrapsHidden.has(prevKey)) {
      state.undergroundTrapsHidden.delete(prevKey);
      state.undergroundTrapsRevealed.add(prevKey);
      state.undergroundTrapRevealMs.set(prevKey, now);
    }
    if (state.undergroundTrapsRevealed.has(playerKey)) {
      if (applyPlayerEnemyHit(state, now, "trap", deps.onLoseReason)) {
        return { playerCell, playerKey, alive: false };
      }
    }
  }

  if (state.traps.has(playerKey)) {
    if (applyPlayerEnemyHit(state, now, "trap", deps.onLoseReason)) {
      return { playerCell, playerKey, alive: false };
    }
  }

  return { playerCell, playerKey, alive: true };
}

function normalizeAngle(angle: number) {
  let out = angle;
  while (out <= -Math.PI) out += Math.PI * 2;
  while (out > Math.PI) out -= Math.PI * 2;
  return out;
}
