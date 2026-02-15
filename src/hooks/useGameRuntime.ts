import { useRuntimeDraw } from "./runtime/useRuntimeDraw";
import { useRuntimeEquipment } from "./runtime/useRuntimeEquipment";
import { useRuntimeInput } from "./runtime/useRuntimeInput";
import { useRuntimeStateUpdate } from "./runtime/useRuntimeStateUpdate";
import { useRuntimeCombat } from "./runtime/useRuntimeCombat";
import type { UseGameRuntimeParams } from "./runtime/types";

export function useGameRuntime({
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
  setSpikesLeft,
  setBombsLeft,
  setCoinsCollected,
}: UseGameRuntimeParams) {
  const { getInputDir } = useRuntimeInput({ keysRef, touchMoveRef });
  const { updateState } = useRuntimeStateUpdate({
    getInputDir,
    touchEnabledRef,
    setBombsLeft,
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
    gameNowRef,
    setSpikesLeft,
    setBombsLeft,
    setCoinsCollected,
  });
  const { swingSword } = useRuntimeCombat({ stateRef, gameNowRef });

  return {
    updateState,
    draw,
    placeSpike,
    placeBomb,
    swingSword,
  };
}
