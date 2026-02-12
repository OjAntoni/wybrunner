import { useEffect, useRef } from "react";
import { handleKeyDown } from "../input/keyboard/handleKeyDown";
import { handleKeyUp } from "../input/keyboard/handleKeyUp";
import type { KeyboardCallbacks, KeyboardControlRefs } from "../input/keyboard/types";

type UseKeyboardControlsParams = KeyboardControlRefs & {
  callbacks: KeyboardCallbacks;
};

export function useKeyboardControls({
  screenRef,
  controlsReturnToGameRef,
  confirmRestartRef,
  pausedRef,
  equipmentOpenRef,
  stateRef,
  keysRef,
  callbacks,
}: UseKeyboardControlsParams) {
  const callbacksRef = useRef<KeyboardCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const refs: KeyboardControlRefs = {
      screenRef,
      controlsReturnToGameRef,
      confirmRestartRef,
      pausedRef,
      equipmentOpenRef,
      stateRef,
      keysRef,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e, refs, callbacksRef.current);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      handleKeyUp(e, refs);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    confirmRestartRef,
    controlsReturnToGameRef,
    equipmentOpenRef,
    keysRef,
    pausedRef,
    screenRef,
    stateRef,
  ]);
}
