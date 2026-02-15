import type { GameState, LoseReason } from "../model/types";

export function loseGame(state: GameState, reason: LoseReason) {
  state.status = "lose";
  state.loseReason = reason;
}
