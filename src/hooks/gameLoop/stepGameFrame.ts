import type { MutableRefObject } from "react";
import type { GameState, GameStatus, UIScreen } from "../../game/model/types";

type StepGameFrameParams = {
  now: number;
  dt: number;
  ctx: CanvasRenderingContext2D;
  stateRef: MutableRefObject<GameState>;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  statusRef: MutableRefObject<GameStatus>;
  updateStateRef: MutableRefObject<(state: GameState, dt: number, now: number) => void>;
  drawRef: MutableRefObject<(ctx: CanvasRenderingContext2D, state: GameState, now: number) => void>;
  setStatus: (value: GameStatus) => void;
  setItemsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  setPlayerHearts: (value: number) => void;
  measureTimings?: boolean;
  uiStateCache: {
    itemsLeft: number;
    coinsCollected: number;
    playerHearts: number;
  };
  onTimings?: (updateMs: number, drawMs: number, activeFrame: boolean) => void;
};

export function stepGameFrame({
  now,
  dt,
  ctx,
  stateRef,
  screenRef,
  confirmRestartRef,
  pausedRef,
  statusRef,
  updateStateRef,
  drawRef,
  setStatus,
  setItemsLeft,
  setCoinsCollected,
  setPlayerHearts,
  measureTimings,
  uiStateCache,
  onTimings,
}: StepGameFrameParams): number {
  const shouldMeasure = !!(measureTimings && onTimings);
  let nextNow = now;
  const state = stateRef.current;
  let updateMs = 0;
  let activeFrame = false;
  if (
    screenRef.current === "game" &&
    !confirmRestartRef.current &&
    !pausedRef.current &&
    state.status === "playing"
  ) {
    activeFrame = true;
    const updateStart = shouldMeasure ? performance.now() : 0;
    nextNow += dt * 1000;
    updateStateRef.current(state, dt, nextNow);
    if (state.status !== statusRef.current) {
      setStatus(state.status);
    }
    if (state.items.size !== uiStateCache.itemsLeft) {
      uiStateCache.itemsLeft = state.items.size;
      setItemsLeft(state.items.size);
    }
    if (state.coinsCollected !== uiStateCache.coinsCollected) {
      uiStateCache.coinsCollected = state.coinsCollected;
      setCoinsCollected(state.coinsCollected);
    }
    if (state.playerHearts !== uiStateCache.playerHearts) {
      uiStateCache.playerHearts = state.playerHearts;
      setPlayerHearts(state.playerHearts);
    }
    if (shouldMeasure) {
      updateMs = performance.now() - updateStart;
    }
  }

  const drawStart = shouldMeasure ? performance.now() : 0;
  drawRef.current(ctx, state, nextNow);
  if (shouldMeasure) {
    const drawMs = performance.now() - drawStart;
    onTimings(updateMs, drawMs, activeFrame);
  }
  return nextNow;
}
