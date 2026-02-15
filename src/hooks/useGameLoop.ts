import { useEffect } from "react";
import { resizeCanvas } from "./gameLoop/resizeCanvas";
import { stepGameFrame } from "./gameLoop/stepGameFrame";
import type { UseGameLoopParams } from "./gameLoop/types";
import { useGameLoopRefs } from "./gameLoop/useGameLoopRefs";

const PERF_REPORT_INTERVAL_MS = 2000;
const PERF_SPIKE_GAP_MS = 24;
const PERF_SPIKE_BUSY_MS = 10;
const ADAPTIVE_DPR_INITIAL = 1.5;
const ADAPTIVE_DPR_MIN = 1;
const ADAPTIVE_DPR_STEP = 0.25;
const ADAPTIVE_DPR_SPIKE_EXTERNAL_MS = 40;
const ADAPTIVE_DPR_SPIKES_BEFORE_DOWNGRADE = 3;
const ADAPTIVE_DPR_WINDOW_MS = 12000;
const MAX_SIM_DT_MS = 24;

type PerfWindow = Window & {
  __GAME_PERF__?: boolean;
  __GAME_MAX_DPR__?: number;
};

export function useGameLoop({
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
  setCoinsCollected,
  setPlayerHearts,
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
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            applyResize();
          })
        : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", applyResize);

    let lastTime = performance.now();
    let gameNow = gameNowRef.current > 0 ? gameNowRef.current : lastTime;
    gameNowRef.current = gameNow;
    const uiStateCache = {
      itemsLeft: Number.NaN,
      coinsCollected: Number.NaN,
      playerHearts: Number.NaN,
    };
    let rafId = 0;
    const perfWindow = window as PerfWindow;
    const adaptiveDprEnabled = perfWindow.__GAME_MAX_DPR__ === undefined;
    let adaptiveMaxDpr = adaptiveDprEnabled
      ? ADAPTIVE_DPR_INITIAL
      : Math.max(ADAPTIVE_DPR_MIN, perfWindow.__GAME_MAX_DPR__ ?? ADAPTIVE_DPR_INITIAL);
    if (adaptiveDprEnabled) {
      perfWindow.__GAME_MAX_DPR__ = adaptiveMaxDpr;
      applyResize();
    }
    let perfFrames = 0;
    let perfGapMsTotal = 0;
    let perfWorstGapMs = 0;
    let perfFrameMsTotal = 0;
    let perfUpdateMsTotal = 0;
    let perfDrawMsTotal = 0;
    let perfWorstFrameMs = 0;
    let perfReportAt = performance.now() + PERF_REPORT_INTERVAL_MS;
    let perfLastUpdateMs = 0;
    let perfLastDrawMs = 0;
    const adaptiveSpikeTimes: number[] = [];

    const onTimings = (updateMs: number, drawMs: number, activeFrame: boolean) => {
      if (!perfWindow.__GAME_PERF__ || !activeFrame) return;
      perfLastUpdateMs = updateMs;
      perfLastDrawMs = drawMs;
    };

    const reportPerfFrame = (rawGapMs: number, activeFrame: boolean) => {
      if (!perfWindow.__GAME_PERF__ || !activeFrame) return;
      const frameMs = perfLastUpdateMs + perfLastDrawMs;
      perfFrames += 1;
      perfGapMsTotal += rawGapMs;
      perfFrameMsTotal += frameMs;
      perfUpdateMsTotal += perfLastUpdateMs;
      perfDrawMsTotal += perfLastDrawMs;
      if (rawGapMs > perfWorstGapMs) perfWorstGapMs = rawGapMs;
      if (frameMs > perfWorstFrameMs) perfWorstFrameMs = frameMs;

      if (rawGapMs >= PERF_SPIKE_GAP_MS || frameMs >= PERF_SPIKE_BUSY_MS) {
        const externalMs = Math.max(0, rawGapMs - frameMs);
        console.log(
          `[perf-spike] gap=${rawGapMs.toFixed(2)}ms busy=${frameMs.toFixed(2)}ms update=${perfLastUpdateMs.toFixed(2)}ms draw=${perfLastDrawMs.toFixed(2)}ms external=${externalMs.toFixed(2)}ms`
        );

        if (adaptiveDprEnabled && externalMs >= ADAPTIVE_DPR_SPIKE_EXTERNAL_MS) {
          const now = performance.now();
          adaptiveSpikeTimes.push(now);
          while (
            adaptiveSpikeTimes.length > 0 &&
            now - adaptiveSpikeTimes[0] > ADAPTIVE_DPR_WINDOW_MS
          ) {
            adaptiveSpikeTimes.shift();
          }
          if (
            adaptiveSpikeTimes.length >= ADAPTIVE_DPR_SPIKES_BEFORE_DOWNGRADE &&
            adaptiveMaxDpr > ADAPTIVE_DPR_MIN
          ) {
            adaptiveMaxDpr = Math.max(ADAPTIVE_DPR_MIN, adaptiveMaxDpr - ADAPTIVE_DPR_STEP);
            perfWindow.__GAME_MAX_DPR__ = adaptiveMaxDpr;
            adaptiveSpikeTimes.length = 0;
            applyResize();
            console.log(`[perf] adaptive DPR lowered to ${adaptiveMaxDpr.toFixed(2)}`);
          }
        }
      }

      const now = performance.now();
      if (now < perfReportAt) return;
      const avgGap = perfGapMsTotal / Math.max(1, perfFrames);
      const avgFrame = perfFrameMsTotal / Math.max(1, perfFrames);
      const avgUpdate = perfUpdateMsTotal / Math.max(1, perfFrames);
      const avgDraw = perfDrawMsTotal / Math.max(1, perfFrames);
      console.log(
        `[perf] gap avg=${avgGap.toFixed(2)}ms busy avg=${avgFrame.toFixed(2)}ms update=${avgUpdate.toFixed(2)}ms draw=${avgDraw.toFixed(2)}ms worst busy=${perfWorstFrameMs.toFixed(2)}ms worst gap=${perfWorstGapMs.toFixed(2)}ms fps=${(1000 / Math.max(0.001, avgGap)).toFixed(1)}`
      );
      perfFrames = 0;
      perfGapMsTotal = 0;
      perfWorstGapMs = 0;
      perfFrameMsTotal = 0;
      perfUpdateMsTotal = 0;
      perfDrawMsTotal = 0;
      perfWorstFrameMs = 0;
      perfReportAt = now + PERF_REPORT_INTERVAL_MS;
    };

    const loop = (time: number) => {
      const rawGapMs = Math.max(0, time - lastTime);
      const dt = Math.min(rawGapMs, MAX_SIM_DT_MS) / 1000;
      lastTime = time;
      if (dprRef.current !== (window.devicePixelRatio || 1)) {
        applyResize();
      }

      gameNow = stepGameFrame({
        now: gameNow,
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
        uiStateCache,
        onTimings,
      });
      gameNowRef.current = gameNow;
      reportPerfFrame(
        rawGapMs,
        screenRef.current === "game" &&
          !confirmRestartRef.current &&
          !pausedRef.current &&
          statusRef.current === "playing"
      );

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", applyResize);
      cancelAnimationFrame(rafId);
    };
  }, [
    canvasRef,
    canvasCssSizeRef,
    confirmRestartRef,
    dprRef,
    drawRef,
    gameNowRef,
    pausedRef,
    screenRef,
    setCoinsCollected,
    setItemsLeft,
    setPlayerHearts,
    setStatus,
    stateRef,
    statusRef,
    updateStateRef,
  ]);
}
