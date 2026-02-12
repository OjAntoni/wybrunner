import { useGameUiActions } from "../useGameUiActions";
import type { ControllerRefs } from "./useControllerRefs";
import type { ControllerStateModel } from "./useControllerState";
import { useControllerKeyboardBindings } from "./useControllerKeyboardBindings";
import { useControllerTouchBindings } from "./useControllerTouchBindings";

type UseControllerInteractionsParams = {
  refs: ControllerRefs;
  state: Pick<
    ControllerStateModel,
    | "touchEnabled"
    | "setScreen"
    | "setStatus"
    | "setItemsLeft"
    | "setCoinsCollected"
    | "setSpikesLeft"
    | "setBombsLeft"
    | "setLoseReason"
    | "setConfirmRestartOpen"
    | "setPaused"
    | "setEquipmentOpen"
    | "setControlsReturnToGame"
    | "setMapOpen"
  >;
  runtime: {
    placeSpike: () => void;
    placeBomb: () => void;
  };
};

export function useControllerInteractions({
  refs,
  state,
  runtime,
}: UseControllerInteractionsParams) {
  const { stateRef, keysRef, screenRef, confirmRestartRef, pausedRef, controlsReturnToGameRef } =
    refs;
  const {
    touchEnabled,
    setScreen,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
    setSpikesLeft,
    setBombsLeft,
    setLoseReason,
    setConfirmRestartOpen,
    setPaused,
    setEquipmentOpen,
    setControlsReturnToGame,
    setMapOpen,
  } = state;

  const touch = useControllerTouchBindings({
    refs,
    touchEnabled,
    runtime,
  });
  const { resetTouchInput, joystickActions } = touch;

  const uiActions = useGameUiActions({
    stateRef,
    gameNowRef: refs.gameNowRef,
    keysRef,
    screenRef,
    touchEnabledRef: refs.touchEnabledRef,
    mapOpenRef: refs.mapOpenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef: refs.equipmentOpenRef,
    controlsReturnToGameRef,
    mapReturnToPauseRef: refs.mapReturnToPauseRef,
    resetTouchInput,
    setScreen,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
    setSpikesLeft,
    setBombsLeft,
    setLoseReason,
    setConfirmRestartOpen,
    setPaused,
    setEquipmentOpen,
    setControlsReturnToGame,
    setMapOpen,
  });

  useControllerKeyboardBindings({
    refs,
    uiActions,
    runtime,
    setPaused,
    setEquipmentOpen,
  });

  return {
    resetTouchInput,
    uiActions,
    joystickActions,
  };
}
