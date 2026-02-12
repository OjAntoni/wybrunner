import type { Vec } from "../model/types";

export function distance(a: Vec, b: Vec) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function clampInt(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v | 0));
}
