import { useGameRuntime } from "../useGameRuntime";
import type { ControllerRefs } from "./useControllerRefs";
import type { ControllerStateModel } from "./useControllerState";

type UseControllerRuntimeParams = {
  refs: ControllerRefs;
  state: Pick<
    ControllerStateModel,
    "setSpikesLeft" | "setBombsLeft" | "setCoinsCollected" | "setLoseReason"
  >;
};

export function useControllerRuntime({ refs, state }: UseControllerRuntimeParams) {
  const {
    stateRef,
    keysRef,
    touchMoveRef,
    touchEnabledRef,
    fogSpritesRef,
    exploreCloudSpritesRef,
    hudTopRef,
    inventoryRef,
    hudRectsRef,
    dprRef,
    canvasRef,
  } = refs;
  const { setSpikesLeft, setBombsLeft, setCoinsCollected, setLoseReason } = state;

  return useGameRuntime({
    stateRef,
    keysRef,
    touchMoveRef,
    touchEnabledRef,
    fogSpritesRef,
    exploreCloudSpritesRef,
    hudTopRef,
    inventoryRef,
    hudRectsRef,
    dprRef,
    canvasRef,
    setSpikesLeft,
    setBombsLeft,
    setCoinsCollected,
    setLoseReason,
  });
}
