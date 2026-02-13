import { useEffect, useRef, type MutableRefObject } from "react";
import { handleMouseDown } from "../input/mouse/handleMouseDown";
import type { MouseCallbacks, MouseControlRefs } from "../input/mouse/types";

type UseMouseControlsParams = MouseControlRefs & {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  callbacks: MouseCallbacks;
};

export function useMouseControls({
  canvasRef,
  screenRef,
  pausedRef,
  confirmRestartRef,
  mapOpenRef,
  equipmentOpenRef,
  stateRef,
  callbacks,
}: UseMouseControlsParams) {
  const callbacksRef = useRef<MouseCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const refs: MouseControlRefs = {
      screenRef,
      pausedRef,
      confirmRestartRef,
      mapOpenRef,
      equipmentOpenRef,
      stateRef,
    };

    const onPointerDown = (e: PointerEvent) => {
      handleMouseDown(e, refs, callbacksRef.current);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [canvasRef, confirmRestartRef, equipmentOpenRef, mapOpenRef, pausedRef, screenRef, stateRef]);
}
