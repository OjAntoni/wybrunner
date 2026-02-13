import { useCallback, type MutableRefObject } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GameState, UIScreen, Vec } from "../../game/model/types";
import { canStartJoystickGesture } from "../../input/touch/joystickGuard";
import { useJoystickPointerState } from "./useJoystickPointerState";

type UseJoystickPointerHandlersParams = {
  touchEnabled: boolean;
  screenRef: MutableRefObject<UIScreen>;
  pausedRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  stateRef: MutableRefObject<GameState>;
  joystickRef: MutableRefObject<HTMLDivElement | null>;
  touchMoveRef: MutableRefObject<Vec>;
  setJoystickActive: (active: boolean) => void;
  setJoystickVisual: (x: number, y: number) => void;
};

export function useJoystickPointerHandlers({
  touchEnabled,
  screenRef,
  pausedRef,
  confirmRestartRef,
  equipmentOpenRef,
  stateRef,
  joystickRef,
  touchMoveRef,
  setJoystickActive,
  setJoystickVisual,
}: UseJoystickPointerHandlersParams) {
  const { movePointerIdRef, resetTouchInput, setJoystickOrigin, updateTouchVector } =
    useJoystickPointerState({
      joystickRef,
      touchMoveRef,
      setJoystickActive,
      setJoystickVisual,
    });

  const onJoystickPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !canStartJoystickGesture(touchEnabled, e.pointerType, {
          screenRef,
          pausedRef,
          confirmRestartRef,
          equipmentOpenRef,
          stateRef,
        })
      ) {
        return;
      }
      if (movePointerIdRef.current !== null && movePointerIdRef.current !== e.pointerId) {
        return;
      }
      setJoystickOrigin(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      movePointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      setJoystickActive(true);
      updateTouchVector(e.clientX, e.clientY);
      e.preventDefault();
    },
    [
      confirmRestartRef,
      equipmentOpenRef,
      pausedRef,
      screenRef,
      setJoystickActive,
      setJoystickOrigin,
      stateRef,
      touchEnabled,
      updateTouchVector,
    ]
  );

  const onJoystickPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (movePointerIdRef.current !== e.pointerId) return;
      updateTouchVector(e.clientX, e.clientY);
      e.preventDefault();
    },
    [updateTouchVector]
  );

  const onJoystickPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (movePointerIdRef.current !== e.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if capture was already released by browser.
      }
      resetTouchInput();
      e.preventDefault();
    },
    [resetTouchInput]
  );

  return {
    resetTouchInput,
    onJoystickPointerDown,
    onJoystickPointerMove,
    onJoystickPointerUp,
  };
}
