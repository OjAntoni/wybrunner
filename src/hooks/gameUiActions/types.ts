import type { MutableRefObject } from "react";
import type { GameState, LoseReason, UIScreen } from "../../game/model/types";

export type UseGameUiActionsParams = {
  stateRef: MutableRefObject<GameState>;
  keysRef: MutableRefObject<Set<string>>;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  controlsReturnToGameRef: MutableRefObject<boolean>;
  resetTouchInput: () => void;
  setScreen: (value: UIScreen) => void;
  setStatus: (value: "playing" | "win" | "lose") => void;
  setItemsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setLoseReason: (value: LoseReason) => void;
  setConfirmRestartOpen: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setEquipmentOpen: (value: boolean) => void;
  setControlsReturnToGame: (value: boolean) => void;
};
