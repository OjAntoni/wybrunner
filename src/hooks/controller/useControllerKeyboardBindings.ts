import { useKeyboardControls } from "../useKeyboardControls";
import type { ControllerRefs } from "./useControllerRefs";

type UiActionsForKeyboard = {
  closeControls: () => void;
  openBestiary: (fromGame: boolean) => void;
  closeBestiary: () => void;
  startNewGame: () => void;
  openControls: (fromGame: boolean) => void;
  goToMainMenu: () => void;
  restart: () => void;
  closeRestartConfirm: () => void;
  closeEquipment: () => void;
  pauseGame: () => void;
  openRestartConfirm: () => void;
  openEquipment: () => void;
  openMap: () => void;
  closeMap: () => void;
};

type UseControllerKeyboardBindingsParams = {
  refs: Pick<
    ControllerRefs,
    | "screenRef"
    | "controlsReturnToGameRef"
    | "confirmRestartRef"
    | "pausedRef"
    | "touchEnabledRef"
    | "mapOpenRef"
    | "equipmentOpenRef"
    | "stateRef"
    | "keysRef"
  >;
  uiActions: UiActionsForKeyboard;
  runtime: {
    placeSpike: () => void;
    placeBomb: () => void;
    swingSword: () => void;
  };
  setPaused: (value: boolean) => void;
  setEquipmentOpen: (value: boolean) => void;
};

export function useControllerKeyboardBindings({
  refs,
  uiActions,
  runtime,
  setPaused,
  setEquipmentOpen,
}: UseControllerKeyboardBindingsParams) {
  const {
    screenRef,
    controlsReturnToGameRef,
    confirmRestartRef,
    pausedRef,
    touchEnabledRef,
    mapOpenRef,
    equipmentOpenRef,
    stateRef,
    keysRef,
  } = refs;
  const { placeSpike, placeBomb, swingSword } = runtime;

  useKeyboardControls({
    screenRef,
    controlsReturnToGameRef,
    confirmRestartRef,
    pausedRef,
    touchEnabledRef,
    mapOpenRef,
    equipmentOpenRef,
    stateRef,
    keysRef,
    callbacks: {
      closeControls: uiActions.closeControls,
      openBestiary: uiActions.openBestiary,
      closeBestiary: uiActions.closeBestiary,
      startNewGame: uiActions.startNewGame,
      openControls: uiActions.openControls,
      goToMainMenu: uiActions.goToMainMenu,
      restart: uiActions.restart,
      closeRestartConfirm: uiActions.closeRestartConfirm,
      closeEquipment: uiActions.closeEquipment,
      pauseGame: uiActions.pauseGame,
      setPaused,
      openRestartConfirm: uiActions.openRestartConfirm,
      setEquipmentOpen,
      placeSpike,
      placeBomb,
      swingSword,
      openEquipment: uiActions.openEquipment,
      openMap: uiActions.openMap,
      closeMap: uiActions.closeMap,
    },
  });
}
