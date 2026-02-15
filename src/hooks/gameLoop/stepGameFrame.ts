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
  resizeCanvas: () => void;
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
  resizeCanvas,
}: StepGameFrameParams): number {
  let nextNow = now;
  const state = stateRef.current;
  if (
    screenRef.current === "game" &&
    !confirmRestartRef.current &&
    !pausedRef.current &&
    state.status === "playing"
  ) {
    nextNow += dt * 1000;
    updateStateRef.current(state, dt, nextNow);
    if (state.status !== statusRef.current) {
      setStatus(state.status);
    }
    setItemsLeft(state.items.size);
    setCoinsCollected(state.coinsCollected);
    setPlayerHearts(state.playerHearts);
  }

  resizeCanvas();
  drawRef.current(ctx, state, nextNow);
  return nextNow;
}
