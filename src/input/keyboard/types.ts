import type { MutableRefObject } from "react";
import type { GameState, UIScreen } from "../../game/model/types";

export type KeyboardCallbacks = {
  closeControls: () => void;
  startNewGame: () => void;
  openControls: (fromGame: boolean) => void;
  goToMainMenu: () => void;
  restart: () => void;
  closeRestartConfirm: () => void;
  closeEquipment: () => void;
  pauseGame: () => void;
  setPaused: (value: boolean) => void;
  openRestartConfirm: () => void;
  setEquipmentOpen: (value: boolean) => void;
  placeSpike: () => void;
  placeBomb: () => void;
  openEquipment: () => void;
  openMap: () => void;
  closeMap: () => void;
};

export type KeyboardControlRefs = {
  screenRef: MutableRefObject<UIScreen>;
  controlsReturnToGameRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  touchEnabledRef: MutableRefObject<boolean>;
  mapOpenRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  stateRef: MutableRefObject<GameState>;
  keysRef: MutableRefObject<Set<string>>;
};
