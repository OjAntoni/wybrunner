import type { MutableRefObject } from "react";

const DEFAULT_MAX_GAME_DPR = 1.5;

type DprWindow = Window & {
  __GAME_MAX_DPR__?: number;
};

type ResizeCanvasParams = {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  dprRef: MutableRefObject<number>;
  canvasCssSizeRef: MutableRefObject<{ w: number; h: number }>;
};

export function resizeCanvas({
  canvasRef,
  dprRef,
  canvasCssSizeRef,
}: ResizeCanvasParams) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));
  const dprWindow = window as DprWindow;
  const rawDpr = window.devicePixelRatio || 1;
  const maxDpr = dprWindow.__GAME_MAX_DPR__ ?? DEFAULT_MAX_GAME_DPR;
  const dpr = Math.max(1, Math.min(rawDpr, maxDpr));
  dprRef.current = dpr;
  canvasCssSizeRef.current = { w: cssW, h: cssH };
  const nextW = Math.floor(cssW * dpr);
  const nextH = Math.floor(cssH * dpr);
  if (canvas.width !== nextW) canvas.width = nextW;
  if (canvas.height !== nextH) canvas.height = nextH;
}
