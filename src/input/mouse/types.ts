import type { MutableRefObject } from "react";
import type { GameState, UIScreen } from "../../game/model/types";

export type MouseCallbacks = {
  swingSword: () => void;
};

export type MouseControlRefs = {
  screenRef: MutableRefObject<UIScreen>;
  pausedRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  mapOpenRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  stateRef: MutableRefObject<GameState>;
};
