import { useGameLoop } from "../useGameLoop";
import { useTouchMode } from "../useTouchMode";
import { useUiStateSync } from "../useUiStateSync";
import type { ControllerRefs } from "./useControllerRefs";
import type { ControllerStateModel } from "./useControllerState";

type UseControllerLifecycleParams = {
  refs: ControllerRefs;
  state: Pick<
    ControllerStateModel,
    | "screen"
    | "confirmRestartOpen"
    | "paused"
    | "equipmentOpen"
    | "controlsReturnToGame"
    | "touchEnabled"
    | "status"
    | "setTouchEnabled"
    | "setCompactHud"
    | "setStatus"
    | "setItemsLeft"
    | "setCoinsCollected"
  >;
  resetTouchInput: () => void;
  runtime: {
    updateState: (state: ControllerRefs["stateRef"]["current"], dt: number, now: number) => void;
    draw: (ctx: CanvasRenderingContext2D, state: ControllerRefs["stateRef"]["current"]) => void;
  };
};

export function useControllerLifecycle({
  refs,
  state,
  resetTouchInput,
  runtime,
}: UseControllerLifecycleParams) {
  const {
    canvasRef,
    dprRef,
    canvasCssSizeRef,
    stateRef,
    screenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    touchEnabledRef,
  } = refs;
  const {
    screen,
    confirmRestartOpen,
    paused,
    equipmentOpen,
    controlsReturnToGame,
    touchEnabled,
    status,
    setTouchEnabled,
    setCompactHud,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
  } = state;
  const { updateState, draw } = runtime;

  useUiStateSync({
    screen,
    confirmRestartOpen,
    paused,
    equipmentOpen,
    controlsReturnToGame,
    touchEnabled,
    status,
    screenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    touchEnabledRef,
    resetTouchInput,
  });

  useTouchMode({ setTouchEnabled, setCompactHud });

  useGameLoop({
    canvasRef,
    dprRef,
    canvasCssSizeRef,
    stateRef,
    screenRef,
    confirmRestartRef,
    pausedRef,
    status,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
    updateState,
    draw,
  });
}
