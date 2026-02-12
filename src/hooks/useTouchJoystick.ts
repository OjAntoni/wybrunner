import type { MutableRefObject } from "react";
import type { GameState, UIScreen, Vec } from "../game/model/types";
import { useJoystickPointerHandlers } from "./touch/useJoystickPointerHandlers";
import { useJoystickVisualState } from "./touch/useJoystickVisualState";
import { useTouchActionHandlers } from "./touch/useTouchActionHandlers";

type UseTouchJoystickParams = {
  touchEnabled: boolean;
  screenRef: MutableRefObject<UIScreen>;
  pausedRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  stateRef: MutableRefObject<GameState>;
  joystickRef: MutableRefObject<HTMLDivElement | null>;
  joystickKnobRef: MutableRefObject<HTMLDivElement | null>;
  touchMoveRef: MutableRefObject<Vec>;
  onPlaceSpike: () => void;
  onPlaceBomb: () => void;
};

export function useTouchJoystick({
  touchEnabled,
  screenRef,
  pausedRef,
  confirmRestartRef,
  equipmentOpenRef,
  stateRef,
  joystickRef,
  joystickKnobRef,
  touchMoveRef,
  onPlaceSpike,
  onPlaceBomb,
}: UseTouchJoystickParams) {
  const { setJoystickVisual, setJoystickActive } = useJoystickVisualState({
    joystickRef,
    joystickKnobRef,
  });

  const joystickHandlers = useJoystickPointerHandlers({
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
  });

  const actionHandlers = useTouchActionHandlers({
    touchEnabled,
    onPlaceSpike,
    onPlaceBomb,
  });

  return {
    resetTouchInput: joystickHandlers.resetTouchInput,
    onJoystickPointerDown: joystickHandlers.onJoystickPointerDown,
    onJoystickPointerMove: joystickHandlers.onJoystickPointerMove,
    onJoystickPointerUp: joystickHandlers.onJoystickPointerUp,
    onTrapPointerDown: actionHandlers.onTrapPointerDown,
    onBombPointerDown: actionHandlers.onBombPointerDown,
  };
}
