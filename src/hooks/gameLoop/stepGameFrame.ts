import type { MutableRefObject } from "react";
import type { GameState, GameStatus, UIScreen } from "../../game/model/types";

type StepGameFrameParams = {
  time: number;
  dt: number;
  ctx: CanvasRenderingContext2D;
  stateRef: MutableRefObject<GameState>;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  statusRef: MutableRefObject<GameStatus>;
  updateStateRef: MutableRefObject<(state: GameState, dt: number, now: number) => void>;
  drawRef: MutableRefObject<(ctx: CanvasRenderingContext2D, state: GameState) => void>;
  setStatus: (value: GameStatus) => void;
  setItemsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  resizeCanvas: () => void;
};

export function stepGameFrame({
  time,
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
  resizeCanvas,
}: StepGameFrameParams) {
  const state = stateRef.current;
  if (
    screenRef.current === "game" &&
    !confirmRestartRef.current &&
    !pausedRef.current &&
    state.status === "playing"
  ) {
    updateStateRef.current(state, dt, time);
    if (state.status !== statusRef.current) {
      setStatus(state.status);
    }
    setItemsLeft(state.items.size);
    setCoinsCollected(state.coinsCollected);
  }

  resizeCanvas();
  drawRef.current(ctx, state);
}
