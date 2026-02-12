import { useEffect, type MutableRefObject } from "react";
import type { UIScreen, GameStatus } from "../game/model/types";

type UseUiStateSyncParams = {
  screen: UIScreen;
  mapOpen: boolean;
  confirmRestartOpen: boolean;
  paused: boolean;
  equipmentOpen: boolean;
  controlsReturnToGame: boolean;
  touchEnabled: boolean;
  status: GameStatus;
  screenRef: MutableRefObject<UIScreen>;
  mapOpenRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  controlsReturnToGameRef: MutableRefObject<boolean>;
  touchEnabledRef: MutableRefObject<boolean>;
  resetTouchInput: () => void;
};

export function useUiStateSync({
  screen,
  mapOpen,
  confirmRestartOpen,
  paused,
  equipmentOpen,
  controlsReturnToGame,
  touchEnabled,
  status,
  screenRef,
  mapOpenRef,
  confirmRestartRef,
  pausedRef,
  equipmentOpenRef,
  controlsReturnToGameRef,
  touchEnabledRef,
  resetTouchInput,
}: UseUiStateSyncParams) {
  useEffect(() => {
    screenRef.current = screen;
    mapOpenRef.current = mapOpen;
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
    mapOpen,
    mapOpenRef,
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
      mapOpen ||
      paused ||
      confirmRestartOpen ||
      equipmentOpen ||
      status !== "playing"
    ) {
      resetTouchInput();
    }
  }, [screen, mapOpen, paused, confirmRestartOpen, equipmentOpen, status, resetTouchInput]);
}
