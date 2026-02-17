import { useCallback, type MutableRefObject } from "react";
import type { GameState, Vec } from "../../game/model/types";
import { updateGameState } from "../../game/systems/updateState";

type UseRuntimeStateUpdateParams = {
  getInputDir: () => Vec;
  touchEnabledRef: MutableRefObject<boolean>;
};

export function useRuntimeStateUpdate({
  getInputDir,
  touchEnabledRef,
}: UseRuntimeStateUpdateParams) {
  const updateState = useCallback(
    (state: GameState, dt: number, now: number) => {
      updateGameState(state, dt, now, {
        getInputDir,
        touchEnabled: touchEnabledRef.current,
      });
    },
    [getInputDir, touchEnabledRef]
  );

  return { updateState };
}
