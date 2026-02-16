import { useGameUiActions } from "../useGameUiActions";
import type { ControllerRefs } from "./useControllerRefs";
import type { ControllerStateModel } from "./useControllerState";
import { useControllerKeyboardBindings } from "./useControllerKeyboardBindings";
import { useControllerMouseBindings } from "./useControllerMouseBindings";
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
    | "setBestiaryReturnToGame"
    | "setMapOpen"
  >;
  runtime: {
    placeSpike: () => void;
    placeBomb: () => void;
    swingSword: () => void;
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
    setBestiaryReturnToGame,
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
    bestiaryReturnToGameRef: refs.bestiaryReturnToGameRef,
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
    setBestiaryReturnToGame,
    setMapOpen,
  });

  useControllerKeyboardBindings({
    refs,
    uiActions,
    runtime,
    setPaused,
    setEquipmentOpen,
  });

  useControllerMouseBindings({
    refs,
    runtime,
  });

  return {
    resetTouchInput,
    uiActions,
    joystickActions,
  };
}
