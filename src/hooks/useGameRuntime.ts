import { useRuntimeDraw } from "./runtime/useRuntimeDraw";
import { useRuntimeEquipment } from "./runtime/useRuntimeEquipment";
import { useRuntimeInput } from "./runtime/useRuntimeInput";
import { useRuntimeStateUpdate } from "./runtime/useRuntimeStateUpdate";
import type { UseGameRuntimeParams } from "./runtime/types";

export function useGameRuntime({
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
}: UseGameRuntimeParams) {
  const { getInputDir } = useRuntimeInput({ keysRef, touchMoveRef });
  const { updateState } = useRuntimeStateUpdate({
    getInputDir,
    touchEnabledRef,
    setCoinsCollected,
    setBombsLeft,
    setLoseReason,
  });
  const { draw } = useRuntimeDraw({
    touchEnabledRef,
    fogSpritesRef,
    exploreCloudSpritesRef,
    hudTopRef,
    inventoryRef,
    hudRectsRef,
    dprRef,
    canvasRef,
  });
  const { placeSpike, placeBomb } = useRuntimeEquipment({
    stateRef,
    setSpikesLeft,
    setBombsLeft,
  });

  return {
    updateState,
    draw,
    placeSpike,
    placeBomb,
  };
}
