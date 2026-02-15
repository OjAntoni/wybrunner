import { PLAYER_INVULNERABLE_MS } from "../../config/constants";
import type { GameState, LoseReason } from "../../model/types";
import { loseGame } from "../outcome";

export function isPlayerInvisibleToEnemies(state: GameState, now: number) {
  return now < state.playerInvulnerableUntilMs;
}

export function applyPlayerEnemyHit(
  state: GameState,
  now: number,
  reason: LoseReason
) {
  if (isPlayerInvisibleToEnemies(state, now)) return false;
  if (state.playerHearts <= 1) {
    state.playerHearts = 0;
    loseGame(state, reason);
    return true;
  }
  state.playerHearts = Math.max(0, state.playerHearts - 1);
  state.playerInvulnerableUntilMs = now + PLAYER_INVULNERABLE_MS;
  state.playerHurtUntilMs = state.playerInvulnerableUntilMs;
  return false;
}
