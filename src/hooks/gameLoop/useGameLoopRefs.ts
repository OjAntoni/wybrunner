import { useEffect, useRef } from "react";
import type { GameState, GameStatus } from "../../game/model/types";

type UseGameLoopRefsParams = {
  status: GameStatus;
  updateState: (state: GameState, dt: number, now: number) => void;
  draw: (ctx: CanvasRenderingContext2D, state: GameState) => void;
};

export function useGameLoopRefs({ status, updateState, draw }: UseGameLoopRefsParams) {
  const statusRef = useRef(status);
  const updateStateRef = useRef(updateState);
  const drawRef = useRef(draw);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    updateStateRef.current = updateState;
    drawRef.current = draw;
  }, [updateState, draw]);

  return {
    statusRef,
    updateStateRef,
    drawRef,
  };
}
