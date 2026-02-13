import {
  HUNTER_VISION_ANGLE_DEG,
  HUNTER_VISION_RADIUS_TILES,
  HUNTER_VISION_RAY_COUNT,
  TILE_SIZE,
  TURRET_LOCK_IN_TRANSITION_MS,
  TURRET_UNLOCK_TRANSITION_MS,
  TURRET_VISION_ANGLE_DEG,
  TURRET_VISION_RADIUS_TILES,
} from "../config/constants";
import type { GameState } from "../model/types";
import { directionFromAngle, getHunterFacingAngle } from "../world/hunterFacing";
import { castVisionRayDistance, sampleVisionConeBoundary } from "../world/hunterVision";
import { isCellCoveredByExploreClouds } from "../world/exploration";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getTurretLineFactor(state: GameState["turrets"][number], now: number) {
  if (state.mode === "track" || state.mode === "cooldown") {
    if (state.lockTransitionDir !== 1) return 1;
    const t = clamp01((now - state.lockTransitionStartMs) / TURRET_LOCK_IN_TRANSITION_MS);
    return t;
  }

  if (state.lockTransitionDir !== -1) return 0;
  const t = clamp01((now - state.lockTransitionStartMs) / TURRET_UNLOCK_TRANSITION_MS);
  return 1 - t;
}

export function drawHunterVisions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const hunter of state.hunters) {
    const hunterCell = {
      x: Math.floor(hunter.pos.x),
      y: Math.floor(hunter.pos.y),
    };
    if (hunter.mode !== "chase" && isCellCoveredByExploreClouds(state, hunterCell.x, hunterCell.y)) {
      continue;
    }

    const facingDirection = directionFromAngle(getHunterFacingAngle(hunter, now));
    const isChasing = hunter.mode === "chase";
    const visionAngle = hunter.visionAngleDeg || HUNTER_VISION_ANGLE_DEG;
    const points = sampleVisionConeBoundary(
      state.grid,
      hunter.pos,
      facingDirection,
      HUNTER_VISION_RADIUS_TILES,
      visionAngle,
      HUNTER_VISION_RAY_COUNT
    );
    if (points.length === 0) continue;

    const hunterX = hunter.pos.x * TILE_SIZE - camX;
    const hunterY = hunter.pos.y * TILE_SIZE - camY;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hunterX, hunterY);
    for (const point of points) {
      ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
    }
    ctx.closePath();
    ctx.fillStyle = isChasing ? "rgba(255, 98, 98, 0.26)" : "rgba(255, 255, 255, 0.18)";
    ctx.fill();
    ctx.strokeStyle = isChasing ? "rgba(255, 122, 122, 0.38)" : "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  for (const turret of state.turrets) {
    const turretCell = {
      x: Math.floor(turret.pos.x),
      y: Math.floor(turret.pos.y),
    };
    if (isCellCoveredByExploreClouds(state, turretCell.x, turretCell.y)) continue;

    const lineFactor = getTurretLineFactor(turret, now);
    const effectiveAngleDeg = Math.max(1, TURRET_VISION_ANGLE_DEG * (1 - lineFactor));
    const direction = directionFromAngle(turret.facingAngle);
    const turretX = turret.pos.x * TILE_SIZE - camX;
    const turretY = turret.pos.y * TILE_SIZE - camY;

    if (effectiveAngleDeg <= 2) {
      const rayDistance = castVisionRayDistance(
        state.grid,
        turret.pos,
        turret.facingAngle,
        TURRET_VISION_RADIUS_TILES
      );
      ctx.save();
      ctx.strokeStyle = "rgba(255, 88, 88, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(turretX, turretY);
      ctx.lineTo(
        (turret.pos.x + Math.cos(turret.facingAngle) * rayDistance) * TILE_SIZE - camX,
        (turret.pos.y + Math.sin(turret.facingAngle) * rayDistance) * TILE_SIZE - camY
      );
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const points = sampleVisionConeBoundary(
      state.grid,
      turret.pos,
      direction,
      TURRET_VISION_RADIUS_TILES,
      effectiveAngleDeg,
      HUNTER_VISION_RAY_COUNT
    );
    if (points.length === 0) continue;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(turretX, turretY);
    for (const point of points) {
      ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 92, 92, 0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 122, 122, 0.46)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}
