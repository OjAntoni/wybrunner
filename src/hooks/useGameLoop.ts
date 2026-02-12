import { useEffect } from "react";
import { resizeCanvas } from "./gameLoop/resizeCanvas";
import { stepGameFrame } from "./gameLoop/stepGameFrame";
import type { UseGameLoopParams } from "./gameLoop/types";
import { useGameLoopRefs } from "./gameLoop/useGameLoopRefs";

export function useGameLoop({
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
}: UseGameLoopParams) {
  const { statusRef, updateStateRef, drawRef } = useGameLoopRefs({
    status,
    updateState,
    draw,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const applyResize = () => {
      resizeCanvas({ canvasRef, dprRef, canvasCssSizeRef });
    };

    applyResize();
    window.addEventListener("resize", applyResize);

    let lastTime = performance.now();
    let rafId = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      stepGameFrame({
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
        resizeCanvas: applyResize,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", applyResize);
      cancelAnimationFrame(rafId);
    };
  }, [
    canvasRef,
    canvasCssSizeRef,
    confirmRestartRef,
    dprRef,
    drawRef,
    pausedRef,
    screenRef,
    setCoinsCollected,
    setItemsLeft,
    setStatus,
    stateRef,
    statusRef,
    updateStateRef,
  ]);
}
