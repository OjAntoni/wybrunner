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
  } = state;

  const touch = useControllerTouchBindings({
    refs,
    touchEnabled,
    runtime,
  });
  const { resetTouchInput, joystickActions } = touch;

  const uiActions = useGameUiActions({
    stateRef,
    keysRef,
    screenRef,
    confirmRestartRef,
    pausedRef,
    controlsReturnToGameRef,
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
