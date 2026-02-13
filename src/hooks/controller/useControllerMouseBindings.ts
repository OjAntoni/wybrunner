import { useMouseControls } from "../useMouseControls";
import type { ControllerRefs } from "./useControllerRefs";

type UseControllerMouseBindingsParams = {
  refs: Pick<
    ControllerRefs,
    | "canvasRef"
    | "screenRef"
    | "pausedRef"
    | "confirmRestartRef"
    | "mapOpenRef"
    | "equipmentOpenRef"
    | "stateRef"
  >;
  runtime: {
    swingSword: () => void;
  };
};

export function useControllerMouseBindings({ refs, runtime }: UseControllerMouseBindingsParams) {
  const {
    canvasRef,
    screenRef,
    pausedRef,
    confirmRestartRef,
    mapOpenRef,
    equipmentOpenRef,
    stateRef,
  } = refs;

  useMouseControls({
    canvasRef,
    screenRef,
    pausedRef,
    confirmRestartRef,
    mapOpenRef,
    equipmentOpenRef,
    stateRef,
    callbacks: {
      swingSword: runtime.swingSword,
    },
  });
}
