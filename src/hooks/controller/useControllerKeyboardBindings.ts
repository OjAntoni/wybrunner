import { useKeyboardControls } from "../useKeyboardControls";
import type { ControllerRefs } from "./useControllerRefs";

type UiActionsForKeyboard = {
  closeControls: () => void;
  startNewGame: () => void;
  openControls: (fromGame: boolean) => void;
  goToMainMenu: () => void;
  restart: () => void;
  closeRestartConfirm: () => void;
  closeEquipment: () => void;
  pauseGame: () => void;
  openRestartConfirm: () => void;
  openEquipment: () => void;
};

type UseControllerKeyboardBindingsParams = {
  refs: Pick<
    ControllerRefs,
    | "screenRef"
    | "controlsReturnToGameRef"
    | "confirmRestartRef"
    | "pausedRef"
    | "equipmentOpenRef"
    | "stateRef"
    | "keysRef"
  >;
  uiActions: UiActionsForKeyboard;
  runtime: {
    placeSpike: () => void;
    placeBomb: () => void;
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
    equipmentOpenRef,
    stateRef,
    keysRef,
  } = refs;
  const { placeSpike, placeBomb } = runtime;

  useKeyboardControls({
    screenRef,
    controlsReturnToGameRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    stateRef,
    keysRef,
    callbacks: {
      closeControls: uiActions.closeControls,
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
      openEquipment: uiActions.openEquipment,
    },
  });
}
