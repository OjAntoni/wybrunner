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
  const { placeSpike, placeBomb } = runtime;

  const {
    resetTouchInput,
    onJoystickPointerDown,
    onTrapPointerDown,
    onBombPointerDown,
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
  });

  return {
    resetTouchInput,
    joystickActions: {
      onJoystickPointerDown,
      onTrapPointerDown,
      onBombPointerDown,
      onJoystickPointerMove,
      onJoystickPointerUp,
    },
  };
}
