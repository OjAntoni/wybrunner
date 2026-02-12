import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

type UseJoystickVisualStateParams = {
  joystickRef: MutableRefObject<HTMLDivElement | null>;
  joystickKnobRef: MutableRefObject<HTMLDivElement | null>;
};

export function useJoystickVisualState({
  joystickRef,
  joystickKnobRef,
}: UseJoystickVisualStateParams) {
  const joystickFrameRef = useRef<number | null>(null);
  const joystickVisualRef = useRef({ x: 0, y: 0 });

  const flushJoystickVisual = useCallback(() => {
    joystickFrameRef.current = null;
    const knob = joystickKnobRef.current;
    if (!knob) return;
    const { x, y } = joystickVisualRef.current;
    knob.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }, [joystickKnobRef]);

  const setJoystickVisual = useCallback(
    (x: number, y: number) => {
      joystickVisualRef.current = { x, y };
      if (joystickFrameRef.current !== null) return;
      joystickFrameRef.current = requestAnimationFrame(flushJoystickVisual);
    },
    [flushJoystickVisual]
  );

  const setJoystickActive = useCallback(
    (active: boolean) => {
      const zone = joystickRef.current;
      if (!zone) return;
      zone.classList.toggle("active", active);
    },
    [joystickRef]
  );

  useEffect(() => {
    return () => {
      if (joystickFrameRef.current !== null) {
        cancelAnimationFrame(joystickFrameRef.current);
        joystickFrameRef.current = null;
      }
    };
  }, []);

  return {
    setJoystickVisual,
    setJoystickActive,
  };
}
