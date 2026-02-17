import { useGameRuntime } from "../useGameRuntime";
import type { ControllerRefs } from "./useControllerRefs";

type UseControllerRuntimeParams = {
  refs: ControllerRefs;
};

export function useControllerRuntime({ refs }: UseControllerRuntimeParams) {
  const {
    stateRef,
    gameNowRef,
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

  return useGameRuntime({
    stateRef,
    gameNowRef,
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
  });
}
