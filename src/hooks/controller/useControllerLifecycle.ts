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
    | "mapOpen"
    | "confirmRestartOpen"
    | "paused"
    | "equipmentOpen"
    | "controlsReturnToGame"
    | "bestiaryReturnToGame"
    | "touchEnabled"
    | "status"
    | "setTouchEnabled"
    | "setCompactHud"
    | "setStatus"
    | "setItemsLeft"
    | "setLoseReason"
  >;
  resetTouchInput: () => void;
  runtime: {
    updateState: (state: ControllerRefs["stateRef"]["current"], dt: number, now: number) => void;
    draw: (
      ctx: CanvasRenderingContext2D,
      state: ControllerRefs["stateRef"]["current"],
      now: number
    ) => void;
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
    gameNowRef,
    stateRef,
    screenRef,
    mapOpenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    bestiaryReturnToGameRef,
    touchEnabledRef,
  } = refs;
  const {
    screen,
    mapOpen,
    confirmRestartOpen,
    paused,
    equipmentOpen,
    controlsReturnToGame,
    bestiaryReturnToGame,
    touchEnabled,
    status,
    setTouchEnabled,
    setCompactHud,
    setStatus,
    setItemsLeft,
    setLoseReason,
  } = state;
  const { updateState, draw } = runtime;

  useUiStateSync({
    screen,
    mapOpen,
    confirmRestartOpen,
    paused,
    equipmentOpen,
    controlsReturnToGame,
    bestiaryReturnToGame,
    touchEnabled,
    status,
    screenRef,
    mapOpenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    bestiaryReturnToGameRef,
    touchEnabledRef,
    resetTouchInput,
  });

  useTouchMode({ setTouchEnabled, setCompactHud });

  useGameLoop({
    canvasRef,
    dprRef,
    canvasCssSizeRef,
    gameNowRef,
    stateRef,
    screenRef,
    confirmRestartRef,
    pausedRef,
    status,
    setStatus,
    setItemsLeft,
    setLoseReason,
    updateState,
    draw,
  });
}
