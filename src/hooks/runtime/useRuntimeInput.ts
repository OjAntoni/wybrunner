import { useCallback, type MutableRefObject } from "react";
import { getInputDirection } from "../../game/input/direction";
import type { Vec } from "../../game/model/types";

type UseRuntimeInputParams = {
  keysRef: MutableRefObject<Set<string>>;
  touchMoveRef: MutableRefObject<Vec>;
};

export function useRuntimeInput({ keysRef, touchMoveRef }: UseRuntimeInputParams) {
  const getInputDir = useCallback((): Vec => {
    return getInputDirection(keysRef.current, touchMoveRef.current);
  }, [keysRef, touchMoveRef]);

  return { getInputDir };
}
