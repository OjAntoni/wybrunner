import { HUNTER_ROTATE_ANIM_MS } from "../config/constants";
import type { Hunter, Vec } from "../model/types";

const TWO_PI = Math.PI * 2;

function normalizeAngle(angle: number) {
  let out = angle;
  while (out <= -Math.PI) out += TWO_PI;
  while (out > Math.PI) out -= TWO_PI;
  return out;
}

function shortestSignedAngleDelta(from: number, to: number) {
  return normalizeAngle(to - from);
}

function easeInOut(t: number) {
  // Smoothstep for subtle turn-in/turn-out.
  return t * t * (3 - 2 * t);
}

export function directionToAngle(direction: Vec) {
  if (direction.x === 0 && direction.y === 0) return 0;
  return Math.atan2(direction.y, direction.x);
}

export function directionFromAngle(angle: number): Vec {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

export function getHunterFacingAngle(hunter: Hunter, now: number) {
  if (hunter.turnEndMs <= hunter.turnStartMs) return hunter.turnToAngle;
  if (now >= hunter.turnEndMs) return hunter.turnToAngle;
  if (now <= hunter.turnStartMs) return hunter.turnFromAngle;

  const duration = hunter.turnEndMs - hunter.turnStartMs;
  if (duration <= 0) return hunter.turnToAngle;

  const t = Math.max(0, Math.min(1, (now - hunter.turnStartMs) / duration));
  const eased = easeInOut(t);
  const delta = shortestSignedAngleDelta(hunter.turnFromAngle, hunter.turnToAngle);
  return normalizeAngle(hunter.turnFromAngle + delta * eased);
}

export function startHunterTurnAnimation(
  hunter: Hunter,
  nextDir: Vec,
  now: number,
  durationMs: number = HUNTER_ROTATE_ANIM_MS
) {
  const nextAngle = directionToAngle(nextDir);
  const currentAngle = getHunterFacingAngle(hunter, now);
  const delta = Math.abs(shortestSignedAngleDelta(currentAngle, nextAngle));

  if (delta <= 0.0001) {
    hunter.turnFromAngle = nextAngle;
    hunter.turnToAngle = nextAngle;
    hunter.turnStartMs = now;
    hunter.turnEndMs = now;
    return;
  }

  hunter.turnFromAngle = currentAngle;
  hunter.turnToAngle = nextAngle;
  hunter.turnStartMs = now;
  hunter.turnEndMs = now + Math.max(0, durationMs);
}
