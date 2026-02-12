import { useCallback, type MutableRefObject } from "react";
import type { GameState, LoseReason, Vec } from "../../game/model/types";
import { updateGameState } from "../../game/systems/updateState";

type UseRuntimeStateUpdateParams = {
  getInputDir: () => Vec;
  touchEnabledRef: MutableRefObject<boolean>;
  setCoinsCollected: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setLoseReason: (value: LoseReason) => void;
};

export function useRuntimeStateUpdate({
  getInputDir,
  touchEnabledRef,
  setCoinsCollected,
  setBombsLeft,
  setLoseReason,
}: UseRuntimeStateUpdateParams) {
  const updateState = useCallback(
    (state: GameState, dt: number, now: number) => {
      updateGameState(state, dt, now, {
        getInputDir,
        touchEnabled: touchEnabledRef.current,
        onCoinsCollected: setCoinsCollected,
        onBombsLeft: setBombsLeft,
        onLoseReason: setLoseReason,
      });
    },
    [getInputDir, setBombsLeft, setCoinsCollected, setLoseReason, touchEnabledRef]
  );

  return { updateState };
}
