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

  const setJoystickOrigin = useCallback(
    (clientX: number, clientY: number, zoneRect: DOMRect) => {
      const zone = joystickRef.current;
      if (!zone) return;
      const width = zone.offsetWidth || 0;
      const height = zone.offsetHeight || 0;
      if (width <= 0 || height <= 0) return;
      const left = clientX - zoneRect.left - width / 2;
      const top = clientY - zoneRect.top - height / 2;
      zone.style.left = `${left.toFixed(1)}px`;
      zone.style.top = `${top.toFixed(1)}px`;
    },
    [joystickRef]
  );

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
    setJoystickOrigin,
    updateTouchVector,
  };
}
