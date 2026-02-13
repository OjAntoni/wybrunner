import { SWORD_SWING_COOLDOWN_MS } from "../config/constants";
import type { GameState } from "../model/types";

export function swingSword(state: GameState, now: number) {
  if (state.status !== "playing") return;
  if (now < state.swordCooldownUntilMs) return;
  state.swordSwingStartMs = now;
  state.swordCooldownUntilMs = now + SWORD_SWING_COOLDOWN_MS;
}
