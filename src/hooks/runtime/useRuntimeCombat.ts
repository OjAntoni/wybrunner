import { useCallback, type MutableRefObject } from "react";
import { swingSword as performSwingSword } from "../../game/actions/combat";
import type { GameState } from "../../game/model/types";

type UseRuntimeCombatParams = {
  stateRef: MutableRefObject<GameState>;
  gameNowRef: MutableRefObject<number>;
};

export function useRuntimeCombat({ stateRef, gameNowRef }: UseRuntimeCombatParams) {
  const swingSword = useCallback(() => {
    performSwingSword(stateRef.current, gameNowRef.current);
  }, [gameNowRef, stateRef]);

  return { swingSword };
}
