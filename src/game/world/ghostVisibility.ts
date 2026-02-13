import { GHOST_APPEAR_ANIM_MS, GHOST_DISAPPEAR_ANIM_MS } from "../config/constants";
import type { GhostMonster } from "../model/types";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getAppearAlpha(ghost: GhostMonster, now: number) {
  if (GHOST_APPEAR_ANIM_MS <= 0) return 1;
  return clamp01((now - ghost.spawnMs) / GHOST_APPEAR_ANIM_MS);
}

function getDisappearAlpha(ghost: GhostMonster, now: number) {
  if (ghost.despawnStartMs === null) return 1;
  if (GHOST_DISAPPEAR_ANIM_MS <= 0) return 0;
  const t = clamp01((now - ghost.despawnStartMs) / GHOST_DISAPPEAR_ANIM_MS);
  return 1 - t;
}

export function getGhostVisibilityAlpha(ghost: GhostMonster, now: number) {
  return clamp01(getAppearAlpha(ghost, now) * getDisappearAlpha(ghost, now));
}

export function isGhostDisappearAnimationFinished(ghost: GhostMonster, now: number) {
  if (ghost.despawnStartMs === null) return false;
  return now - ghost.despawnStartMs >= GHOST_DISAPPEAR_ANIM_MS;
}

