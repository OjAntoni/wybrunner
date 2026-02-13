import { useTouchJoystick } from "../useTouchJoystick";
import type { ControllerRefs } from "./useControllerRefs";

type UseControllerTouchBindingsParams = {
  refs: Pick<
    ControllerRefs,
    | "screenRef"
    | "pausedRef"
    | "confirmRestartRef"
    | "equipmentOpenRef"
    | "stateRef"
    | "joystickRef"
    | "joystickKnobRef"
    | "touchMoveRef"
  >;
  touchEnabled: boolean;
  runtime: {
    placeSpike: () => void;
    placeBomb: () => void;
    swingSword: () => void;
  };
};

export function useControllerTouchBindings({
  refs,
  touchEnabled,
  runtime,
}: UseControllerTouchBindingsParams) {
  const {
    screenRef,
    pausedRef,
    confirmRestartRef,
    equipmentOpenRef,
    stateRef,
    joystickRef,
    joystickKnobRef,
    touchMoveRef,
  } = refs;
  const { placeSpike, placeBomb, swingSword } = runtime;

  const {
    resetTouchInput,
    onJoystickPointerDown,
    onTrapPointerDown,
    onBombPointerDown,
    onSwordPointerDown,
    onJoystickPointerMove,
    onJoystickPointerUp,
  } = useTouchJoystick({
    touchEnabled,
    screenRef,
    pausedRef,
    confirmRestartRef,
    equipmentOpenRef,
    stateRef,
    joystickRef,
    joystickKnobRef,
    touchMoveRef,
    onPlaceSpike: placeSpike,
    onPlaceBomb: placeBomb,
    onSwingSword: swingSword,
  });

  return {
    resetTouchInput,
    joystickActions: {
      onJoystickPointerDown,
      onTrapPointerDown,
      onBombPointerDown,
      onSwordPointerDown,
      onJoystickPointerMove,
      onJoystickPointerUp,
    },
  };
}
