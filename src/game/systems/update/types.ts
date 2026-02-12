import type { LoseReason, Vec } from "../../model/types";

export type UpdateGameStateDeps = {
  getInputDir: () => Vec;
  touchEnabled: boolean;
  onCoinsCollected: (value: number) => void;
  onBombsLeft: (value: number) => void;
  onLoseReason: (value: LoseReason) => void;
};
