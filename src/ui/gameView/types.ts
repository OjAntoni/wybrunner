import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { GameStatus, LoseReason, UIScreen } from "../../game/model/types";

export type GameViewModel = {
  screen: UIScreen;
  status: GameStatus;
  loseReason: LoseReason;
  touchEnabled: boolean;
  compactHud: boolean;
  paused: boolean;
  confirmRestartOpen: boolean;
  equipmentOpen: boolean;
  controlsReturnToGame: boolean;
  itemsLeft: number;
  coinsCollected: number;
  spikesLeft: number;
  bombsLeft: number;
  helpText: string;
};

export type GameViewRefs = {
  canvasRef: RefObject<HTMLCanvasElement>;
  hudTopRef: RefObject<HTMLDivElement>;
  inventoryRef: RefObject<HTMLElement>;
  joystickRef: RefObject<HTMLDivElement>;
  joystickKnobRef: RefObject<HTMLDivElement>;
};

export type GameViewActions = {
  onPauseGame: () => void;
  onOpenEquipment: () => void;
  onCloseEquipment: () => void;
  onOpenControls: (fromGame: boolean) => void;
  onCloseControls: () => void;
  onOpenRestartConfirm: () => void;
  onCloseRestartConfirm: () => void;
  onGoToMainMenu: () => void;
  onStartNewGame: () => void;
  onRestartConfirmed: () => void;
  onResumeFromPause: () => void;
  onPauseOpenEquipment: () => void;
  onResumeFromEquipment: () => void;
  onJoystickPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onJoystickPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onJoystickPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onTrapPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onBombPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
};

export type GameViewProps = {
  view: GameViewModel;
  refs: GameViewRefs;
  actions: GameViewActions;
};
