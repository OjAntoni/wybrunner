import { useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { runTouchAction } from "../../input/touch/touchAction";

type UseTouchActionHandlersParams = {
  touchEnabled: boolean;
  onPlaceSpike: () => void;
  onPlaceBomb: () => void;
  onSwingSword: () => void;
};

export function useTouchActionHandlers({
  touchEnabled,
  onPlaceSpike,
  onPlaceBomb,
  onSwingSword,
}: UseTouchActionHandlersParams) {
  const onTrapPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      runTouchAction(e, touchEnabled, onPlaceSpike);
    },
    [onPlaceSpike, touchEnabled]
  );

  const onBombPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      runTouchAction(e, touchEnabled, onPlaceBomb);
    },
    [onPlaceBomb, touchEnabled]
  );

  const onSwordPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      runTouchAction(e, touchEnabled, onSwingSword);
    },
    [onSwingSword, touchEnabled]
  );

  return {
    onTrapPointerDown,
    onBombPointerDown,
    onSwordPointerDown,
  };
}
