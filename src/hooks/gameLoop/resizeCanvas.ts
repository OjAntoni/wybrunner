import type { MutableRefObject } from "react";

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
  const dpr = window.devicePixelRatio || 1;
  dprRef.current = dpr;
  canvasCssSizeRef.current = { w: cssW, h: cssH };
  const nextW = Math.floor(cssW * dpr);
  const nextH = Math.floor(cssH * dpr);
  if (canvas.width !== nextW) canvas.width = nextW;
  if (canvas.height !== nextH) canvas.height = nextH;
}
