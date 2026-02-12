import type { GameState, LoseReason } from "../model/types";

export function loseGame(
  state: GameState,
  reason: LoseReason,
  onLoseReason: (value: LoseReason) => void
) {
  state.status = "lose";
  state.loseReason = reason;
  onLoseReason(reason);
}
