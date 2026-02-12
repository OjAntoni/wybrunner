import { useEffect, type MutableRefObject } from "react";
import type { UIScreen, GameStatus } from "../game/model/types";

type UseUiStateSyncParams = {
  screen: UIScreen;
  confirmRestartOpen: boolean;
  paused: boolean;
  equipmentOpen: boolean;
  controlsReturnToGame: boolean;
  touchEnabled: boolean;
  status: GameStatus;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  controlsReturnToGameRef: MutableRefObject<boolean>;
  touchEnabledRef: MutableRefObject<boolean>;
  resetTouchInput: () => void;
};

export function useUiStateSync({
  screen,
  confirmRestartOpen,
  paused,
  equipmentOpen,
  controlsReturnToGame,
  touchEnabled,
  status,
  screenRef,
  confirmRestartRef,
  pausedRef,
  equipmentOpenRef,
  controlsReturnToGameRef,
  touchEnabledRef,
  resetTouchInput,
}: UseUiStateSyncParams) {
  useEffect(() => {
    screenRef.current = screen;
    confirmRestartRef.current = confirmRestartOpen;
    pausedRef.current = paused;
    equipmentOpenRef.current = equipmentOpen;
    controlsReturnToGameRef.current = controlsReturnToGame;
    touchEnabledRef.current = touchEnabled;
  }, [
    confirmRestartOpen,
    confirmRestartRef,
    controlsReturnToGame,
    controlsReturnToGameRef,
    equipmentOpen,
    equipmentOpenRef,
    paused,
    pausedRef,
    screen,
    screenRef,
    touchEnabled,
    touchEnabledRef,
  ]);

  useEffect(() => {
    if (
      screen !== "game" ||
      paused ||
      confirmRestartOpen ||
      equipmentOpen ||
      status !== "playing"
    ) {
      resetTouchInput();
    }
  }, [screen, paused, confirmRestartOpen, equipmentOpen, status, resetTouchInput]);
}
