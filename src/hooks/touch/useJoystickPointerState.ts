import { useCallback, useRef, type MutableRefObject } from "react";
import { sampleJoystick } from "../../input/touch/joystickMath";
import type { Vec } from "../../game/model/types";

type UseJoystickPointerStateParams = {
  joystickRef: MutableRefObject<HTMLDivElement | null>;
  touchMoveRef: MutableRefObject<Vec>;
  setJoystickActive: (active: boolean) => void;
  setJoystickVisual: (x: number, y: number) => void;
};

export function useJoystickPointerState({
  joystickRef,
  touchMoveRef,
  setJoystickActive,
  setJoystickVisual,
}: UseJoystickPointerStateParams) {
  const movePointerIdRef = useRef<number | null>(null);

  const resetTouchInput = useCallback(() => {
    movePointerIdRef.current = null;
    touchMoveRef.current = { x: 0, y: 0 };
    setJoystickActive(false);
    setJoystickVisual(0, 0);
  }, [setJoystickActive, setJoystickVisual, touchMoveRef]);

  const updateTouchVector = useCallback(
    (clientX: number, clientY: number) => {
      const zone = joystickRef.current;
      if (!zone) return;

      const sample = sampleJoystick(clientX, clientY, zone.getBoundingClientRect());
      touchMoveRef.current = sample.move;
      setJoystickVisual(sample.knobX, sample.knobY);
    },
    [joystickRef, setJoystickVisual, touchMoveRef]
  );

  return {
    movePointerIdRef,
    resetTouchInput,
    updateTouchVector,
  };
}
