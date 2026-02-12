import type { MutableRefObject } from "react";
import type { GameState, GameStatus, UIScreen } from "../../game/model/types";

export type UseGameLoopParams = {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  dprRef: MutableRefObject<number>;
  canvasCssSizeRef: MutableRefObject<{ w: number; h: number }>;
  gameNowRef: MutableRefObject<number>;
  stateRef: MutableRefObject<GameState>;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  status: GameStatus;
  setStatus: (value: GameStatus) => void;
  setItemsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  updateState: (state: GameState, dt: number, now: number) => void;
  draw: (ctx: CanvasRenderingContext2D, state: GameState, now: number) => void;
};
